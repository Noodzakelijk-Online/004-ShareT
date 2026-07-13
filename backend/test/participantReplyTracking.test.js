const test = require('node:test');
const assert = require('node:assert/strict');

const crypto = require('node:crypto');
const { findOwnerReply, matchReplyTarget } = require('../services/replyNotificationService');
const { verifyWebhookSignature } = require('../services/trelloWebhookService');
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

test('a normal owner reply routes automatically when one freelancer is waiting', () => {
  const result = matchReplyTarget([
    { participantEmail: 'kamal@example.com', participantName: 'Kamal Uddin', commentDate: '2026-07-13T10:00:00Z' }
  ], 'Yes please, tonight would be great.');

  assert.equal(result.status, 'matched');
  assert.equal(result.reason, 'single-pending-participant');
  assert.equal(result.group.participantEmail, 'kamal@example.com');
});

test('a normal mobile reply containing a name selects that freelancer', () => {
  const result = matchReplyTarget([
    { participantEmail: 'kamal@example.com', participantName: 'Kamal Uddin', commentDate: '2026-07-13T10:00:00Z' },
    { participantEmail: 'sara@example.com', participantName: 'Sara Vos', commentDate: '2026-07-13T10:01:00Z' }
  ], 'Kamal, yes please, tonight would be great.');

  assert.equal(result.status, 'matched');
  assert.equal(result.reason, 'unique-first-name-match');
  assert.equal(result.group.participantEmail, 'kamal@example.com');
});

test('multiple waiting freelancers without a name remain safely ambiguous', () => {
  const result = matchReplyTarget([
    { participantEmail: 'kamal@example.com', participantName: 'Kamal Uddin' },
    { participantEmail: 'sara@example.com', participantName: 'Sara Vos' }
  ], 'Thanks, I will review this today.');

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.groups.length, 2);
});

test('a first name that is also a common word is not matched inside a sentence', () => {
  const result = matchReplyTarget([
    { participantEmail: 'will@example.com', participantName: 'Will Peters' },
    { participantEmail: 'sara@example.com', participantName: 'Sara Vos' }
  ], 'I will review this today.');

  assert.equal(result.status, 'ambiguous');
});

test('Trello webhook signatures are verified against the exact callback URL', () => {
  const previousSecret = process.env.TRELLO_API_SECRET;
  process.env.TRELLO_API_SECRET = 'test-trello-secret';
  try {
    const body = Buffer.from(JSON.stringify({ action: { id: 'reply-1', type: 'commentCard' } }));
    const callbackUrl = 'https://sharet.example/api/trello-webhooks/callback';
    const signature = crypto
      .createHmac('sha1', process.env.TRELLO_API_SECRET)
      .update(Buffer.concat([body, Buffer.from(callbackUrl)]))
      .digest('base64');

    assert.equal(verifyWebhookSignature(body, signature, callbackUrl), true);
    assert.equal(verifyWebhookSignature(body, 'invalid', callbackUrl), false);
  } finally {
    if (previousSecret === undefined) delete process.env.TRELLO_API_SECRET;
    else process.env.TRELLO_API_SECRET = previousSecret;
  }
});
