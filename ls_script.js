let count = 0;
let pbrTime = -1;
let pbrSize = -1;
const incrementBtn = document.getElementById('increment-btn');
const syncBtn = document.getElementById('sync-btn');
const countEl = document.getElementById('count');
const pbrEl = document.getElementById('pbr');

window.addEventListener('storage', async (ev) => {
  if (ev.key !== 'STATE_UPDATED' || ev.newValue === null) {
    return;
  }

  const data = JSON.parse(ev.newValue);

  if (data.type === 'COUNT_UPDATED') {
    count = await getValue('count');
  }
  if (data.type === 'PLAYER_RESPONSE_UPDATED') {
    pbrTime = (Date.now() - data.payload.startTs) / 1000;
    pbrSize = Math.round(data.payload.playerResponse.length / 1024);
  }
  render();
});

function syncState(type, payload) {
  localStorage.setItem('STATE_UPDATED', JSON.stringify({
    type,
    payload,
  }));
  localStorage.removeItem('STATE_UPDATED')
}

function render() {
  countEl.innerHTML = count;
  if (pbrTime >= 0) {
    pbrEl.innerHTML =
        `playback response (${pbrSize}Kb) received after ${pbrTime}s`;

  } else {
    pbrEl.innerHTML = `playback response not received`;
  }
}

function syncPlayerResponse() {
  syncState('PLAYER_RESPONSE_UPDATED', {
    playerResponse: window.playerResponse,
    startTs: Date.now(),
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
  syncState('COUNT_UPDATED');
}

async function run() {
  count = await getValue('count') ?? 0;
  render();
  incrementBtn.addEventListener('click', increment);
  syncBtn.addEventListener('click', syncPlayerResponse);
}

run();
