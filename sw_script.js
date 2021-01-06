let count = 0;
let swLife = 0;
let db;
const incrementBtn = document.getElementById('increment-btn');
const syncBtn = document.getElementById('sync-btn');
const countEl = document.getElementById('count');
const swHeartBeatEl = document.getElementById('sw-heartbeat');

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

async function loadCountFromDb() {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const request = db.transaction('data').objectStore('data').get('count');
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function loadHeartbeatFromDb() {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const request = db.transaction('data').objectStore('data').get('heartbeat');
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function render() {
  countEl.innerHTML = count;
  swHeartBeatEl.innerHTML = `SW has lived for ${swLife}s`;
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    alert('Service worker is not supported');
    return;
  }

  const registration = navigator.serviceWorker.register('./sw.js')
  navigator.serviceWorker.addEventListener('message', async (evt) => {
    if (evt.data.type === 'COUNT_UPDATED') {
      count = await loadCountFromDb();
      render();
    }
    if (evt.data.type === 'SW_HEARTBEAT') {
      swLife = await loadHeartbeatFromDb();
      render();
    }
    if (evt.data.type === 'PLAYER_RESPONSE_UPDATED') {
      console.log(`Player response updated after ${
          (Date.now() - evt.data.payload.startTs) / 1000}s`);
    }
  });
  console.log(`Registration succeeded. Scope is ${registration.scope}`);
}

function syncPlayerResponse() {
  navigator.serviceWorker.controller.postMessage({
    type: 'SYNC_PLAYER_RESPONSE',
    payload: {
      playerResponse: window.playerResponse,
      startTs: Date.now(),
    },
  });
}

function increment() {
  count++;
  render();
  navigator.serviceWorker.controller.postMessage({
    type: 'INCREMENT',
  });
}

async function run() {
  count = await loadCountFromDb() ?? 0;
  swLife = await loadHeartbeatFromDb() ?? 0;
  render();
  await registerSW();
  incrementBtn.addEventListener('click', increment);
  syncBtn.addEventListener('click', syncPlayerResponse);
}

run();
