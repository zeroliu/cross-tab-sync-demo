let count = 0;
let pbrTime = 0;
const incrementBtn = document.getElementById('increment-btn');
const syncBtn = document.getElementById('sync-btn');
const countEl = document.getElementById('count');
const pbrEl = document.getElementById('pbr');

function render() {
  countEl.innerHTML = count;
  if (pbrTime > 0) {
    pbrEl.innerHTML = `playback response (80kb) received after ${pbrTime}s`;
  } else {
    pbrEl.innerHTML = `playback response not received`;
  }
}

const bc = new BroadcastChannel('bc_channel');
bc.onmessage = async (evt) => {
  if (evt.data.type === 'COUNT_UPDATED') {
    count = await getValue('count');
  }
  if (evt.data.type === 'PLAYER_RESPONSE_UPDATED') {
    pbrTime = (Date.now() - evt.data.payload.startTs) / 1000;
  }
  render();
};

function syncPlayerResponse() {
  bc.postMessage({
    type: 'PLAYER_RESPONSE_UPDATED',
    payload: {
      playerResponse,
      startTs: Date.now(),
    },
  });
}

async function increment() {
  count++;
  render();
  await updateValue('count', (count) => {
    if (!count) {
      return 1;
    }
    return count + 1;
  })
  bc.postMessage({
    type: 'COUNT_UPDATED',
  });
}

async function run() {
  count = await getValue('count') ?? 0;
  render();
  incrementBtn.addEventListener('click', increment);
  syncBtn.addEventListener('click', syncPlayerResponse);
}

run();
