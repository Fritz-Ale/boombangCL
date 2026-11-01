import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Checks the public client/server event contract without starting a database.
// A matching event name is necessary, but not sufficient, for gameplay readiness.
const client = new URL('../../client/src/enums/RequestSocketsEnum.js', import.meta.url);
const server = new URL('../../server/src/enums/RequestSocketsEnum.js', import.meta.url);
function eventValues(source) {
  const matches = [...source.matchAll(/\b[A-Z][A-Z0-9_]*\s*:\s*['"]([^'"]+)['"]/g)];
  return new Set(matches.map(match => match[1]));
}

test('HTML5 client and Socket.IO server share core gameplay request events', async () => {
  const [clientSource, serverSource] = await Promise.all([
    readFile(client, 'utf8'), readFile(server, 'utf8'),
  ]);
  const clientEvents = eventValues(clientSource);
  const serverEvents = eventValues(serverSource);
  const required = {
    account: ['login', 'register'],
    rooms: ['get_public_areas', 'request:join_public_area', 'request:get_public_area_data'],
    islands: ['request:island_create', 'request:get_my_islands', 'request:join_island'],
    avatars: ['request:change_look'],
    chat: ['request:send_chat'],
    minigames: ['request:minigame_subscribe'],
  };
  for (const [feature, events] of Object.entries(required)) {
    for (const event of events) {
      assert.ok(clientEvents.has(event), feature + ': missing client event ' + event);
      assert.ok(serverEvents.has(event), feature + ': missing server event ' + event);
    }
  }
});
