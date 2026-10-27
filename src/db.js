import { defaultState, validateState } from './model.js';

let connection;
export function openDatabase(name = 'preco-artesao') {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Seu navegador não disponibilizou o banco local.'));
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); };
      resolve(db);
    };
    request.onerror = () => reject(new Error('Não foi possível abrir o banco local. Verifique as permissões do navegador.'));
    request.onblocked = () => reject(new Error('Feche outras abas do aplicativo para atualizar o banco local.'));
  });
}
async function database(provided) {
  if (provided) return provided;
  if (!connection) connection = openDatabase().catch(error => { connection = null; throw error; });
  return connection;
}
export async function loadState(provided) {
  const db = await database(provided);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readonly');
    const request = tx.objectStore('state').get('app');
    tx.oncomplete = () => {
      try { resolve(request.result === undefined ? defaultState() : validateState(request.result)); }
      catch (e) { reject(e); }
    };
    tx.onerror = tx.onabort = () => reject(new Error('Não foi possível ler os dados locais. Não limpe os dados do navegador.'));
  });
}
export async function saveState(state, provided, expected) {
  const valid = validateState(state);
  const expectedJSON = expected === undefined ? undefined : JSON.stringify(validateState(expected));
  const db = await database(provided);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite');
    const store = tx.objectStore('state');
    let failure;
    const request = store.get('app');
    request.onsuccess = () => {
      try {
        if (expectedJSON !== undefined && JSON.stringify(validateState(request.result ?? defaultState())) !== expectedJSON) {
          throw new Error('Os dados foram alterados em outra aba. Recarregue esta página antes de editar; as alterações desta tela não foram salvas. Faça backup.');
        }
        store.put(valid, 'app');
      } catch (error) { failure = error; tx.abort(); }
    };
    tx.oncomplete = () => resolve(valid);
    tx.onerror = tx.onabort = () => reject(failure || new Error('Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado. Exporte um backup.'));
  });
}
