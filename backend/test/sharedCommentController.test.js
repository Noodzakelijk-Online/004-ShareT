const test = require('node:test');
const assert = require('node:assert/strict');

const { __test } = require('../controllers/sharedCommentController');

test('shared relay labels the freelancer and directly mentions the owner', () => {
  const result = __test.formatComment({
    text: 'The worker dashboard is ready.',
    authorName: '  Kamal\nUddin  ',
    notifyUsername: 'noodzakelijkonline',
    nativeAuthor: false
  });

  assert.equal(
    result,
    '**Kamal Uddin**: The worker dashboard is ready.\n\n@noodzakelijkonline'
  );
});

test('per-share relay relies on its native Trello author row', () => {
  const result = __test.formatComment({
    text: 'The worker dashboard is ready.',
    authorName: 'Kamal Uddin',
    notifyUsername: '@owner',
    nativeAuthor: true
  });

  assert.equal(result, 'The worker dashboard is ready.\n\n@owner');
});

test('token candidates prefer the per-share identity and remove duplicates', () => {
  const oldBotToken = process.env.TRELLO_BOT_TOKEN;
  process.env.TRELLO_BOT_TOKEN = 'shared-token';

  try {
    const candidates = __test.buildTokenCandidates(
      { guestTrelloToken: 'freelancer-token' },
      { trelloToken: 'shared-token' }
    );

    assert.deepEqual(candidates.map(candidate => candidate.label), [
      'freelancer-relay',
      'shared-relay'
    ]);
  } finally {
    if (oldBotToken === undefined) delete process.env.TRELLO_BOT_TOKEN;
    else process.env.TRELLO_BOT_TOKEN = oldBotToken;
  }
});

test('owner fallback reports that Trello will suppress the self-notification', () => {
  const result = __test.assessTrelloNotification({
    comment: { memberCreator: { id: 'owner-id', username: 'owner' } },
    candidate: { label: 'owner-fallback' },
    connection: { trelloMemberId: 'owner-id', trelloUsername: 'owner' },
    notifyUsername: 'owner'
  });

  assert.equal(result.bellExpected, false);
  assert.match(result.warning, /does not notify/i);
});

test('a distinct relay mention reports normal Trello bell delivery', () => {
  const result = __test.assessTrelloNotification({
    comment: { memberCreator: { id: 'relay-id', username: 'sharet-updates' } },
    candidate: { label: 'shared-relay' },
    connection: { trelloMemberId: 'owner-id', trelloUsername: 'owner' },
    notifyUsername: 'owner'
  });

  assert.deepEqual(result, { bellExpected: true, warning: null });
});
