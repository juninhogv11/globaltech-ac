"use strict";
// Cópia do Wi-Fi (nome e senha) gravado pelo portal, por serial do equipamento.
// O XX530v não deixa o ACS ler a senha; esta cópia é usada para restaurar após reset de fábrica.
const fs = require("fs");
const path = require("path");
const { USERS_FILE } = require("./env");

const FILE = path.join(path.dirname(USERS_FILE), "wifi-backup.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(db) {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, FILE);
}

function get(serial) {
  return load()[serial] || null;
}

// bands: { "2.4GHz": { ssid, pass }, "5GHz": { ssid, pass } }; senha vazia = mantém a guardada
function put(serial, bands, user) {
  const db = load();
  const cur = (db[serial] && db[serial].wifi) || {};
  const wifi = { ...cur };
  for (const [band, w] of Object.entries(bands)) {
    wifi[band] = { ssid: w.ssid, pass: w.pass || (cur[band] && cur[band].pass) || "" };
  }
  db[serial] = { wifi, at: new Date().toISOString(), user };
  save(db);
  return db[serial];
}

// Resumo sem senhas, para a página do dispositivo
function summary(serial) {
  const e = get(serial);
  if (!e) return null;
  const bands = {};
  for (const [band, w] of Object.entries(e.wifi || {})) bands[band] = { ssid: w.ssid, hasPass: !!w.pass };
  return { bands, at: e.at, user: e.user };
}

module.exports = { get, put, summary };
