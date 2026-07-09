/**
 * Shared Comment Controller
 *
 * Posts comments from public ShareT links into Trello without requiring the
 * external freelancer/client to own or connect a Trello account.
 */

const { SharedLink, TrelloConnection, AccessLog } = require('../db/pouchdb');
const { sendShareTUpdateNotification } = require('../utils/notificationService');

const TRELLO_API_BASE = 'https://api.trello.com/1';

function normalizeTrelloMention(username) {
  const value = (username || '').trim().replace(/^@+/, '');
  return value ? `@${value}` : '';
}

function resolveNotifyMention() {
  return normalizeTrelloMention(
    process.env.SHARET_TRELLO_NOTIFY_USERNAME ||
    process.env.TRELLO_NOTIFY_USERNAME ||
    'noodzakelijkonline'
  );
}

function normalizeAuthorName(authorName) {
  const value = (authorName || '').trim();
  return value || 'External ShareT user';
}

function formatComment({ text, authorName, share }) {
  const mention = resolveNotifyMention();
  const author = normalizeAuthorName(authorName);
  const message = (text || '').trim();

  const parts = [];
  if (mention) parts.push(mention);
  parts.push('**ShareT update**');
  parts.push(`**From:** ${author}`);
  if (share.cardName) parts.push(`**Card:** ${share.cardName}`);
  if (share.boardName) parts.push(`**Board:** ${share.boardName}`);
  parts.push('---');
  parts.push(message);

  return parts.join('\n\n');
}

async function postTrelloComment({ cardId, text, key, token }) {
  const url = `${TRELLO_API_BASE}/cards/${cardId}/actions/comments?key=${key}&token=${token}&text=${encodeURIComponent(text)}`;
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.message || data.error || response.statusText || 'Unknown Trello error';
    throw new Error(`Trello comment failed (${response.status}): ${detail}`);
  }

  return data;
}

function buildTokenCandidates(connection) {
  const candidates = [];

  if (process.env.TRELLO_BOT_TOKEN) {
    candidates.push({ label: 'bot', token: process.env.TRELLO_BOT_TOKEN });
  }

  const allowOwnerFallback = process.env.SHARET_ALLOW_OWNER_COMMENT_FALLBACK !== 'false';
  if (allowOwnerFallback && connection?.trelloToken) {
    candidates.push({ label: 'owner-fallback', token: connection.trelloToken });
  }

  return candidates;
}

// Public route: freelancers do not need a Trello account. ShareT posts through
// TRELLO_BOT_TOKEN when available, mentions the configured Trello username, and
// can also send an independent email notification.
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

    const commentText = formatComment({ text, authorName, share });
    const tokenCandidates = buildTokenCandidates(connection);

    if (tokenCandidates.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No Trello posting token is configured'
      });
    }

    let comment;
    let postedBy = null;
    const failures = [];

    for (const candidate of tokenCandidates) {
      try {
        comment = await postTrelloComment({
          cardId: share.cardId,
          text: commentText,
          key,
          token: candidate.token
        });
        postedBy = candidate.label;
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

    await sendShareTUpdateNotification({
      share,
      authorName: normalizeAuthorName(authorName),
      authorEmail,
      text: text.trim(),
      trelloCommentUrl: comment?.data?.card?.shortLink
        ? `https://trello.com/c/${comment.data.card.shortLink}`
        : undefined,
      postedBy
    });

    res.json({
      success: true,
      data: comment,
      comment,
      notification: {
        trelloMention: resolveNotifyMention() || null,
        postedBy
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
