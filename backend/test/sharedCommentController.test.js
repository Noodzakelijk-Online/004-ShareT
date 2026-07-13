const test = require('node:test');
const assert = require('node:assert/strict');

const { __test } = require('../controllers/sharedCommentController');

function mockResponse(data, { ok = true, status = 200, statusText = 'OK' } = {}) {
  return {
    ok,
    status,
    statusText,
    json: async () => data
  };
}

async function withMockFetch(responses, assertion) {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    const response = responses.shift();
    assert.ok(response, `Unexpected Trello request: ${url}`);
    return response;
  };

  try {
    await assertion(calls);
  } finally {
    global.fetch = originalFetch;
  }
}

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
    assert.ok(candidates.every(candidate => candidate.autoAssignToCard));
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

test('relay membership check leaves an already-assigned bot unchanged', { concurrency: false }, async () => {
  await withMockFetch([
    mockResponse({ id: 'bot-id', username: 'sharet', fullName: 'ShareT' }),
    mockResponse({ idMembers: ['owner-id', 'bot-id'] })
  ], async (calls) => {
    const result = await __test.ensureRelayAssignedToCard({
      cardId: 'card-id',
      key: 'api-key',
      token: 'bot-token'
    });

    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /\/members\/me\?/);
    assert.match(calls[1].url, /\/cards\/card-id\?/);
    assert.deepEqual(result, {
      member: { id: 'bot-id', username: 'sharet', fullName: 'ShareT' },
      assigned: true,
      added: false,
      alreadyAssigned: true
    });
  });
});

test('relay is automatically added when it is missing from the card', { concurrency: false }, async () => {
  await withMockFetch([
    mockResponse({ id: 'bot-id', username: 'sharet', fullName: 'ShareT' }),
    mockResponse({ idMembers: ['owner-id'] }),
    mockResponse({ id: 'card-id', idMembers: ['owner-id', 'bot-id'] })
  ], async (calls) => {
    const result = await __test.ensureRelayAssignedToCard({
      cardId: 'card-id',
      key: 'api-key',
      token: 'bot-token'
    });

    assert.equal(calls.length, 3);
    assert.equal(calls[2].method, 'POST');
    const assignmentUrl = new URL(calls[2].url);
    assert.equal(assignmentUrl.pathname, '/1/cards/card-id/idMembers');
    assert.equal(assignmentUrl.searchParams.get('value'), 'bot-id');
    assert.equal(result.added, true);
    assert.equal(result.alreadyAssigned, false);
  });
});

test('relay assignment failure is explicit when the bot lacks board access', { concurrency: false }, async () => {
  await withMockFetch([
    mockResponse({ id: 'bot-id', username: 'sharet', fullName: 'ShareT' }),
    mockResponse({ idMembers: ['owner-id'] }),
    mockResponse(
      { message: 'member is not on the board' },
      { ok: false, status: 400, statusText: 'Bad Request' }
    )
  ], async () => {
    await assert.rejects(
      __test.ensureRelayAssignedToCard({
        cardId: 'card-id',
        key: 'api-key',
        token: 'bot-token'
      }),
      /relay card assignment failed \(400\): member is not on the board/
    );
  });
});
