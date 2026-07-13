const { CommentThread, SharedLink, TrelloConnection } = require('../db/pouchdb');
const { sendFreelancerReplyNotification } = require('../utils/notificationService');

const TRELLO_API_BASE = 'https://api.trello.com/1';
const processingThreads = new Set();
let monitorTimer = null;
let monitorRunning = false;

function isOwnerComment(comment, connection) {
  if (comment?.type !== 'commentCard') return false;
  const creator = comment.memberCreator || comment.data?.memberCreator;
  if (!creator) return false;

  if (connection.trelloMemberId && creator.id) {
    return connection.trelloMemberId === creator.id;
  }

  return Boolean(
    connection.trelloUsername && creator.username &&
    connection.trelloUsername.toLowerCase() === creator.username.toLowerCase()
  );
}

function findOwnerReply(thread, comments, connection) {
  const commentTime = new Date(thread.commentDate).getTime();
  return [...(comments || [])]
    .filter(comment => {
      if (comment.id === thread.trelloCommentId || !isOwnerComment(comment, connection)) return false;
      const replyTime = new Date(comment.date).getTime();
      return Number.isFinite(replyTime) && replyTime > commentTime;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

async function processReplyNotificationsForShare({ share, connection, comments }) {
  const threads = await CommentThread.findPendingByShareId(share.shareId);
  const result = { checked: threads.length, sent: 0, pending: 0, failed: 0 };

  for (const thread of threads) {
    if (processingThreads.has(thread._id)) continue;
    const reply = findOwnerReply(thread, comments, connection);
    if (!reply) {
      result.pending += 1;
      continue;
    }

    processingThreads.add(thread._id);
    try {
      const delivery = await sendFreelancerReplyNotification({
        thread,
        reply,
        share,
        ownerName: connection.trelloFullName
      });

      if (delivery.sent) {
        await CommentThread.markNotified(thread, reply);
        result.sent += 1;
      } else {
        result.failed += 1;
      }
    } catch (error) {
      console.error('ShareT reply notification processing failed:', error);
      result.failed += 1;
    } finally {
      processingThreads.delete(thread._id);
    }
  }

  return result;
}

async function fetchTrelloComments(share, connection) {
  const query = new URLSearchParams({
    key: process.env.TRELLO_API_KEY,
    token: connection.trelloToken,
    filter: 'commentCard',
    limit: '1000'
  });
  const response = await fetch(`${TRELLO_API_BASE}/cards/${share.cardId}/actions?${query}`);
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(`Trello reply scan failed (${response.status})`);
  }

  return data;
}

async function processPendingReplyNotifications() {
  if (monitorRunning || !process.env.TRELLO_API_KEY) return { skipped: true };
  monitorRunning = true;

  try {
    const pending = await CommentThread.findAllPending();
    const shareIds = [...new Set(pending.map(thread => thread.shareId))];
    const totals = { shares: shareIds.length, checked: 0, sent: 0, pending: 0, failed: 0 };

    for (const shareId of shareIds) {
      try {
        const share = await SharedLink.findByShareId(shareId);
        if (!share || !share.isActive) continue;
        const connection = await TrelloConnection.findByUserId(share.userId);
        if (!connection?.trelloToken) continue;
        const comments = await fetchTrelloComments(share, connection);
        const result = await processReplyNotificationsForShare({ share, connection, comments });
        totals.checked += result.checked;
        totals.sent += result.sent;
        totals.pending += result.pending;
        totals.failed += result.failed;
      } catch (error) {
        console.error(`ShareT reply scan failed for ${shareId}:`, error);
        totals.failed += 1;
      }
    }

    return totals;
  } finally {
    monitorRunning = false;
  }
}

function startReplyNotificationMonitor() {
  if (monitorTimer) return monitorTimer;
  const requestedInterval = Number(process.env.SHARET_REPLY_POLL_INTERVAL_MS || 60 * 1000);
  const interval = Math.max(15 * 1000, requestedInterval);

  monitorTimer = setInterval(() => {
    processPendingReplyNotifications().catch(error => {
      console.error('ShareT background reply monitor failed:', error);
    });
  }, interval);
  monitorTimer.unref?.();
  return monitorTimer;
}

function stopReplyNotificationMonitor() {
  if (monitorTimer) clearInterval(monitorTimer);
  monitorTimer = null;
}

module.exports = {
  findOwnerReply,
  processReplyNotificationsForShare,
  processPendingReplyNotifications,
  startReplyNotificationMonitor,
  stopReplyNotificationMonitor
};
