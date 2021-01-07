importScripts('./db.js');

async function setHeartBeat(value) {
  await setValue('heartbeat', value);
}

async function increment() {
  await updateValue('count', (count) => {
    if (!count) {
      return 1;
    }
    return count + 1;
  });
}

self.addEventListener('install', evt => {
  console.log('SW installed', evt);
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  console.log('SW activated', evt);
  self.clients.claim();
})

self.addEventListener('message', async (evt) => {
  if (evt.data && evt.data.type === 'INCREMENT') {
    await increment();
    const clients = await self.clients.matchAll({
      type: 'window',
    });
    if (clients) {
      for (const client of clients) {
        client.postMessage({
          type: 'COUNT_UPDATED',
        });
      }
    }
  }
  if (evt.data && evt.data.type === 'SYNC_PLAYER_RESPONSE') {
    const clients = await self.clients.matchAll({
      type: 'window',
    });
    if (clients) {
      for (const client of clients) {
        if (client.id === evt.source.id) {
          continue;
        }
        client.postMessage({
          type: 'PLAYER_RESPONSE_UPDATED',
          payload: evt.data.payload,
        });
      }
    }
  }
});

let start;
async function init() {
  await setHeartBeat(0);
  start = Date.now();
  setInterval(async () => {
    const beat = Math.round((Date.now() - start) / 1000);
    await setHeartBeat(beat);
    const clients = await self.clients.matchAll({
      type: 'window',
    });
    if (clients) {
      for (const client of clients) {
        client.postMessage({
          type: 'SW_HEARTBEAT',
        });
      }
    }
  }, 1000);
}

init();
