const test = require('node:test');
const assert = require('node:assert/strict');

const { findOwnerReply } = require('../services/replyNotificationService');
const { __test: notificationTest } = require('../utils/notificationService');

test('the next owner comment after a freelancer update is selected as the reply', () => {
  const thread = {
    trelloCommentId: 'freelancer-comment',
    commentDate: '2026-07-13T10:00:00.000Z'
  };
  const comments = [
    {
      id: 'later-other-member',
      type: 'commentCard',
      date: '2026-07-13T10:01:00.000Z',
      memberCreator: { id: 'someone-else' }
    },
    {
      id: 'second-owner-reply',
      type: 'commentCard',
      date: '2026-07-13T10:05:00.000Z',
      memberCreator: { id: 'owner-id' }
    },
    {
      id: 'first-owner-reply',
      type: 'commentCard',
      date: '2026-07-13T10:03:00.000Z',
      memberCreator: { id: 'owner-id' }
    }
  ];

  const reply = findOwnerReply(thread, comments, { trelloMemberId: 'owner-id' });
  assert.equal(reply.id, 'first-owner-reply');
});

test('comments before the freelancer update are never treated as replies', () => {
  const reply = findOwnerReply(
    { trelloCommentId: 'freelancer-comment', commentDate: '2026-07-13T10:00:00.000Z' },
    [{
      id: 'old-owner-comment',
      type: 'commentCard',
      date: '2026-07-13T09:59:00.000Z',
      memberCreator: { id: 'owner-id' }
    }],
    { trelloMemberId: 'owner-id' }
  );

  assert.equal(reply, null);
});

test('reply email contains both sides of the conversation and the ShareT link', () => {
  const body = notificationTest.buildReplyEmailBody({
    thread: { commentText: 'The dashboard is ready.' },
    reply: { data: { text: 'Thank you, I will review it.' } },
    share: { cardName: 'Worker dashboard', boardName: 'Doing' },
    ownerName: 'Noodzakelijk Online',
    shareUrl: 'https://sharet.example/shared/abc'
  });

  assert.match(body, /The dashboard is ready/);
  assert.match(body, /Thank you, I will review it/);
  assert.match(body, /https:\/\/sharet\.example\/shared\/abc/);
});
