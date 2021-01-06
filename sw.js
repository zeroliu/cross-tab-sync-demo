let db;
async function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('count');
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('data');
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    }
  });
}

async function setHeartBeat(value) {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const store = db.transaction('data', 'readwrite').objectStore('data');
    const writeRequest = store.put(value, 'heartbeat');
    writeRequest.onsuccess = () => {
      resolve();
    };
    writeRequest.onerror = () => {
      reject(writeRequest.error);
    };
  });
}

async function increment() {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const store = db.transaction('data', 'readwrite').objectStore('data');
    const getRequest = store.get('count');
    getRequest.onsuccess = () => {
      const currentCount = getRequest.result || 0;
      const writeRequest = store.put(currentCount + 1, 'count');
      writeRequest.onsuccess = () => {
        resolve(currentCount + 1);
      };
      writeRequest.onerror = () => {
        reject(writeRequest.error);
      };
    };
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
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
    console.log(evt.data.payload);
    const clients = await self.clients.matchAll({
      type: 'window',
    });
    if (clients) {
      for (const client of clients) {
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
