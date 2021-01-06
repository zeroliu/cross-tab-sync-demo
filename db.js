let db;

async function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('db');
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

async function getValue(key) {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const request = db.transaction('data').objectStore('data').get(key);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function setValue(key, value) {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const store = db.transaction('data', 'readwrite').objectStore('data');
    const writeRequest = store.put(value, key);
    writeRequest.onsuccess = () => {
      resolve();
    };
    writeRequest.onerror = () => {
      reject(writeRequest.error);
    };
  });
}

async function updateValue(key, updateCb) {
  if (!db) {
    db = await openDb();
  }
  return new Promise((resolve, reject) => {
    const store = db.transaction('data', 'readwrite').objectStore('data');
    const getRequest = store.get(key);
    getRequest.onsuccess = () => {
      const currentValue = getRequest.result;
      const nextValue = updateCb(currentValue);
      const writeRequest = store.put(nextValue, key);
      writeRequest.onsuccess = () => {
        resolve(nextValue);
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
