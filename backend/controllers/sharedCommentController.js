/**
 * Shared Comment Controller
 *
 * Trello always attributes a comment to the member that owns the API token.
 * ShareT therefore supports two relay modes for people who cannot use Trello:
 *
 * 1. A per-share relay account, whose Trello profile carries the freelancer's
 *    name. This is the only way to get a native Trello author row.
 * 2. A shared ShareT relay account. The real author is rendered prominently in
 *    the comment body while the relay account remains the technical author.
 *
 * Both modes mention the connected owner so Trello creates a normal unread
 * notification. Posting with the owner's own token remains a last-resort
 * delivery fallback, but Trello intentionally suppresses self-notifications.
 */

const { SharedLink, TrelloConnection, AccessLog } = require('../db/pouchdb');
const { sendShareTUpdateNotification } = require('../utils/notificationService');

const TRELLO_API_BASE = 'https://api.trello.com/1';
const MAX_AUTHOR_NAME_LENGTH = 80;

function normalizeTrelloUsername(username) {
  return (username || '').trim().replace(/^@+/, '');
}

function resolveNotifyUsername(connection) {
  return normalizeTrelloUsername(
    process.env.SHARET_TRELLO_NOTIFY_USERNAME ||
    process.env.TRELLO_NOTIFY_USERNAME ||
    connection?.trelloUsername
  );
}

function normalizeAuthorName(authorName) {
  const value = (authorName || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_AUTHOR_NAME_LENGTH);

  return value || 'External ShareT user';
}

function formatComment({ text, authorName, notifyUsername, nativeAuthor }) {
  const author = normalizeAuthorName(authorName);
  const message = (text || '').trim();
  const parts = [];

  // A shared relay cannot impersonate a Trello member. Keep the real person
  // unmistakable while preserving the compact conversation style.
  parts.push(nativeAuthor ? message : `**${author}**: ${message}`);

  // A direct username mention is what creates the normal unread Trello
  // notification. It must be authored by a different Trello member.
  if (notifyUsername) parts.push(`@${normalizeTrelloUsername(notifyUsername)}`);

  return parts.join('\n\n');
}

async function trelloApiRequest({ path, key, token, method = 'GET', params = {}, operation = 'request' }) {
  const query = new URLSearchParams({ key, token, ...params });
  const response = await fetch(`${TRELLO_API_BASE}${path}?${query}`, { method });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.message || data.error || response.statusText || 'Unknown Trello error';
    throw new Error(`Trello ${operation} failed (${response.status}): ${detail}`);
  }

  return data;
}

async function postTrelloComment({ cardId, text, key, token }) {
  return trelloApiRequest({
    path: `/cards/${cardId}/actions/comments`,
    key,
    token,
    method: 'POST',
    params: { text },
    operation: 'comment'
  });
}

async function ensureRelayAssignedToCard({ cardId, key, token }) {
  const member = await trelloApiRequest({
    path: '/members/me',
    key,
    token,
    params: { fields: 'id,username,fullName' },
    operation: 'relay identity lookup'
  });

  if (!member?.id) {
    throw new Error('Trello relay identity lookup returned no member ID');
  }

  const card = await trelloApiRequest({
    path: `/cards/${cardId}`,
    key,
    token,
    params: { fields: 'idMembers' },
    operation: 'card membership lookup'
  });
  const memberIds = Array.isArray(card?.idMembers) ? card.idMembers : [];
  const alreadyAssigned = memberIds.includes(member.id);

  if (!alreadyAssigned) {
    await trelloApiRequest({
      path: `/cards/${cardId}/idMembers`,
      key,
      token,
      method: 'POST',
      params: { value: member.id },
      operation: 'relay card assignment'
    });
  }

  return {
    member: {
      id: member.id,
      username: member.username,
      fullName: member.fullName
    },
    assigned: true,
    added: !alreadyAssigned,
    alreadyAssigned
  };
}

function buildTokenCandidates(share, connection) {
  const candidates = [];

  // A dedicated, admin-managed relay identity can have the freelancer's name
  // without requiring the freelancer to log in to or even access Trello.
  if (share?.guestTrelloToken) {
    candidates.push({
      label: 'freelancer-relay',
      token: share.guestTrelloToken,
      nativeAuthor: true,
      autoAssignToCard: true
    });
  }

  if (process.env.TRELLO_BOT_TOKEN) {
    candidates.push({
      label: 'shared-relay',
      token: process.env.TRELLO_BOT_TOKEN,
      nativeAuthor: false,
      autoAssignToCard: true
    });
  }

  const allowOwnerFallback = process.env.SHARET_ALLOW_OWNER_COMMENT_FALLBACK !== 'false';
  if (allowOwnerFallback && connection?.trelloToken) {
    candidates.push({
      label: 'owner-fallback',
      token: connection.trelloToken,
      nativeAuthor: false,
      autoAssignToCard: false
    });
  }

  // Do not retry the same token under multiple labels.
  return candidates.filter((candidate, index, all) =>
    all.findIndex(item => item.token === candidate.token) === index
  );
}

function getPostingMember(comment) {
  return comment?.memberCreator || comment?.data?.memberCreator || null;
}

function assessTrelloNotification({ comment, candidate, connection, notifyUsername }) {
  const postingMember = getPostingMember(comment);
  const postingUsername = normalizeTrelloUsername(postingMember?.username);
  const targetUsername = normalizeTrelloUsername(notifyUsername);
  const ownerUsername = normalizeTrelloUsername(connection?.trelloUsername);
  const sameMemberId = Boolean(
    postingMember?.id && connection?.trelloMemberId &&
    postingMember.id === connection.trelloMemberId &&
    (!targetUsername || targetUsername === ownerUsername)
  );
  const sameUsername = Boolean(
    postingUsername && targetUsername &&
    postingUsername.toLowerCase() === targetUsername.toLowerCase()
  );
  const ownerPostingForOwner = candidate.label === 'owner-fallback' &&
    (!targetUsername || targetUsername === ownerUsername);

  if (!targetUsername) {
    return {
      bellExpected: false,
      warning: 'No Trello notification username is configured.'
    };
  }

  if (sameMemberId || sameUsername || ownerPostingForOwner) {
    return {
      bellExpected: false,
      warning: 'Trello does not notify a member about a comment posted by that same member. Configure a distinct relay token.'
    };
  }

  return { bellExpected: true, warning: null };
}

function buildNotificationStatus() {
  const hasSharedRelay = Boolean(process.env.TRELLO_BOT_TOKEN);
  const hasExplicitTarget = Boolean(normalizeTrelloUsername(
    process.env.SHARET_TRELLO_NOTIFY_USERNAME || process.env.TRELLO_NOTIFY_USERNAME
  ));

  return {
    sharedRelayConfigured: hasSharedRelay,
    targetMode: hasExplicitTarget ? 'explicit-username' : 'connected-owner',
    ownerFallbackEnabled: process.env.SHARET_ALLOW_OWNER_COMMENT_FALLBACK !== 'false',
    autoAssignRelayToCards: true,
    nativeAuthorMode: 'per-share-relay-token'
  };
}

// Public route: freelancers do not need a Trello login. ShareT posts through a
// relay token, directly mentions the owner, and can also send an email fallback.
exports.addComment = async (req, res) => {
  try {
    const { text, authorName, authorEmail } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const share = await SharedLink.findByShareId(req.params.shareId);

    if (!share || !share.permissions.canComment) {
      return res.status(403).json({
        success: false,
        message: 'Comments not allowed'
      });
    }

    const connection = await TrelloConnection.findByUserId(share.userId);
    if (!connection) {
      return res.status(500).json({
        success: false,
        message: 'Owner not connected to Trello'
      });
    }

    const key = process.env.TRELLO_API_KEY;
    if (!key) {
      return res.status(500).json({
        success: false,
        message: 'Trello API key is not configured'
      });
    }

    const notifyUsername = resolveNotifyUsername(connection);
    const tokenCandidates = buildTokenCandidates(share, connection);

    if (tokenCandidates.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No Trello posting token is configured'
      });
    }

    let comment;
    let postedWith = null;
    const failures = [];

    for (const candidate of tokenCandidates) {
      try {
        const relayAssignment = candidate.autoAssignToCard
          ? await ensureRelayAssignedToCard({
              cardId: share.cardId,
              key,
              token: candidate.token
            })
          : null;

        comment = await postTrelloComment({
          cardId: share.cardId,
          text: formatComment({
            text,
            authorName,
            notifyUsername,
            nativeAuthor: candidate.nativeAuthor
          }),
          key,
          token: candidate.token
        });
        postedWith = { ...candidate, relayAssignment };
        break;
      } catch (error) {
        failures.push(`${candidate.label}: ${error.message}`);
      }
    }

    if (!comment) {
      return res.status(502).json({
        success: false,
        message: 'Unable to post comment to Trello',
        errors: failures
      });
    }

    await AccessLog.create({
      shareId: req.params.shareId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      action: 'comment'
    });

    const trelloNotification = assessTrelloNotification({
      comment,
      candidate: postedWith,
      connection,
      notifyUsername
    });

    await sendShareTUpdateNotification({
      share,
      authorName: normalizeAuthorName(authorName),
      authorEmail,
      text: text.trim(),
      trelloCommentUrl: comment?.data?.card?.shortLink
        ? `https://trello.com/c/${comment.data.card.shortLink}`
        : undefined,
      postedBy: postedWith.label,
      bellExpected: trelloNotification.bellExpected
    });

    const postingMember = getPostingMember(comment);
    res.json({
      success: true,
      data: comment,
      comment,
      notification: {
        trelloMention: notifyUsername ? `@${notifyUsername}` : null,
        postedBy: postedWith.label,
        identityMode: postedWith.nativeAuthor ? 'native-relay' : 'labelled-relay',
        trelloAuthor: postingMember ? {
          id: postingMember.id,
          username: postingMember.username,
          fullName: postingMember.fullName
        } : null,
        relayAssignment: postedWith.relayAssignment,
        bellExpected: trelloNotification.bellExpected,
        warning: trelloNotification.warning
      }
    });
  } catch (error) {
    console.error('Shared comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

exports.getNotificationStatus = buildNotificationStatus;

exports.__test = {
  assessTrelloNotification,
  buildNotificationStatus,
  buildTokenCandidates,
  ensureRelayAssignedToCard,
  formatComment,
  normalizeAuthorName,
  normalizeTrelloUsername,
  resolveNotifyUsername
};
