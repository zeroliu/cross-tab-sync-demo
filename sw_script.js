let count = 0;
let swLife = 0;
let pbrTime = 0;
const incrementBtn = document.getElementById('increment-btn');
const syncBtn = document.getElementById('sync-btn');
const countEl = document.getElementById('count');
const swHeartBeatEl = document.getElementById('sw-heartbeat');
const pbrEl = document.getElementById('pbr');

function render() {
  countEl.innerHTML = count;
  swHeartBeatEl.innerHTML = `SW has lived for ${swLife}s`;
  if (pbrTime > 0) {
    pbrEl.innerHTML = `playback response (80kb) received after ${pbrTime}s`;
  } else {
    pbrEl.innerHTML = `playback response not received`;
  }
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    alert('Service worker is not supported');
    return;
  }

  const registration = navigator.serviceWorker.register('./sw.js');
  navigator.serviceWorker.addEventListener('message', async (evt) => {
    if (evt.data.type === 'COUNT_UPDATED') {
      count = await getValue('count');
    }
    if (evt.data.type === 'SW_HEARTBEAT') {
      swLife = await getValue('heartbeat');
    }
    if (evt.data.type === 'PLAYER_RESPONSE_UPDATED') {
      pbrTime = (Date.now() - evt.data.payload.startTs) / 1000;
    }
    render();
  });
  console.log(`Registration succeeded. Scope is ${registration.scope}`);
}

function syncPlayerResponse() {
  navigator.serviceWorker.controller.postMessage({
    type: 'SYNC_PLAYER_RESPONSE',
    payload: {
      playerResponse,
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
  count = await getValue('count') ?? 0;
  swLife = await getValue('heartbeat') ?? 0;
  render();
  await registerSW();
  incrementBtn.addEventListener('click', increment);
  syncBtn.addEventListener('click', syncPlayerResponse);
}

run();
