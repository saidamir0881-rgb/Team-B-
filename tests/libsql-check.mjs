import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createClient} from '@libsql/client';
import {createApp} from '../server/index.mjs';
import {schema,seedStatements} from '../server/schema.mjs';
async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
const close = server => new Promise(resolve => {
  server.closeAllConnections();
  server.close(resolve);
});

  const dir = process.argv[2];
  const url = pathToFileURL(join(dir, 'test.db')).href;
  const seed = createClient({
    url
  });
  await seed.executeMultiple(schema);
  await seed.batch(seedStatements(), 'write');
  seed.close();
  const first = createApp({
    databaseUrl: url,
    aiKey: '',
    aiModel: ''
  });
  const second = createApp({
    databaseUrl: url,
    aiKey: '',
    aiModel: ''
  });
  const a = await listen(first.server);
  const b = await listen(second.server);
  try {
    const login = await fetch(a + '/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'student@demo.local',
        password: 'Demo2026!'
      })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const headers = {
      'Content-Type': 'application/json',
      Cookie: cookie
    };
    const me = await (await fetch(b + '/api/me', {
      headers
    })).json();
    assert.equal(me.user.id, 1);
    const shop = await (await fetch(b + '/api/rewards', {
      headers
    })).json();
    const book = shop.rewards.find(r => r.icon === 'books');
    await first.db.execute('UPDATE users SET tokens=500 WHERE id=1');
    const results = await Promise.all([a, b].map(base => fetch(base + '/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reward_id: book.id
      })
    })));
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const after = await (await fetch(a + '/api/rewards', {
      headers
    })).json();
    assert.equal(after.balance, 0);
    assert.equal(after.orders.length, 1);
    assert.equal(after.rewards.find(r => r.id === book.id).stock, book.stock - 1);
    const order = after.orders[0];
    const cancel = await fetch(b + `/api/orders/${order.id}/cancel`, {
      method: 'POST',
      headers,
      body: '{}'
    });
    assert.equal(cancel.status, 200);
    const restored = await (await fetch(a + '/api/rewards', {
      headers
    })).json();
    assert.equal(restored.balance, 500);
    assert.equal(restored.rewards.find(r => r.id === book.id).stock, book.stock);
  } finally {
    await close(first.server);
    await close(second.server);
    first.db.close();
    second.db.close();
  }
