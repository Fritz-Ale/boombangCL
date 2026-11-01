'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const connect = require('socket.io-client');
const createGameTransport = require('../src/config/server');
const ConnectedUsersCollection = require('../src/collections/ConnectedUsersCollection');

test('game server transport: internal endpoints reject public requests and Socket.IO handshakes', async () => {
  // Isolated ephemeral port: no MariaDB, Laravel, emulator or bots are started.
  // This checks transport readiness, not gameplay or authenticated player login.
  const old = {
    CLIENT_URL: process.env.CLIENT_URL,
    BOT_PREAUTH_TOKEN: process.env.BOT_PREAUTH_TOKEN,
    PORTAL_STATS_TOKEN: process.env.PORTAL_STATS_TOKEN,
  };
  process.env.CLIENT_URL = 'http://127.0.0.1:5173';
  process.env.BOT_PREAUTH_TOKEN = 'ci-bot-secret-do-not-deploy';
  process.env.PORTAL_STATS_TOKEN = 'ci-stats-secret-do-not-deploy';

  let io;
  let socket;
  try {
    const transport = createGameTransport(0);
    io = transport.io;
    const server = transport.httpServer;
    if (!server.listening) await once(server, 'listening');

    const address = server.address();
    assert.ok(address && address.port > 0);
    const base = 'http://127.0.0.1:' + address.port;

    let res = await fetch(base + '/internal/add-bot-token', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({token:'a'.repeat(40)}),
    });
    assert.equal(res.status, 403, 'public callers cannot preauthorize bots');

    res = await fetch(base + '/internal/add-bot-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Bot-Preauth-Token':'wrong' },
      body: JSON.stringify({token:'a'.repeat(40)}),
    });
    assert.equal(res.status, 403, 'bad internal token fails');

    res = await fetch(base + '/internal/add-bot-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Bot-Preauth-Token':process.env.BOT_PREAUTH_TOKEN },
      body: JSON.stringify({token:'invalid<script>'}),
    });
    assert.equal(res.status, 400, 'preauthorization validates bot token format');

    res = await fetch(base + '/internal/portal-stats');
    assert.equal(res.status, 403, 'online player stats are not public');

    const players = [
      ['unit-player-one', {id:41, is_bot:false}],
      ['unit-player-dupe', {id:41, is_bot:false}],
      ['unit-bot', {id:50, is_bot:true}],
    ];
    for (const [key,player] of players) ConnectedUsersCollection.add(key,player);
    try {
      res = await fetch(base + '/internal/portal-stats', {
        headers: {'X-Portal-Stats-Token':'wrong'},
      });
      assert.equal(res.status,403);

      res = await fetch(base + '/internal/portal-stats', {
        headers: {'X-Portal-Stats-Token':process.env.PORTAL_STATS_TOKEN},
      });
      assert.equal(res.status,200);
      assert.equal(res.headers.get('cache-control'),'no-store');
      assert.deepEqual(await res.json(),{online_players:1},
        'the stats endpoint excludes bots and does not count duplicate player IDs');
    } finally {
      for(const [key] of players) ConnectedUsersCollection.removeUser(key);
    }

    // Exercise a real Socket.IO WebSocket handshake, not an in-memory mock.
    socket = connect(base,{
      transports:['websocket'],reconnection:false,timeout:3500,forceNew:true,
    });
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Socket.IO handshake timed out')),5000);
      socket.once('connect',()=>{clearTimeout(timer);resolve();});
      socket.once('connect_error',error=>{clearTimeout(timer);reject(error);});
    });
    assert.equal(socket.connected,true);
  } finally {
    socket?.disconnect();
    if (io) await new Promise(resolve=>io.close(resolve));
    for(const [name,value] of Object.entries(old)){
      if(value===undefined)delete process.env[name]; else process.env[name]=value;
    }
  }
});
