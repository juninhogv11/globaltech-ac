// Restaura o Wi-Fi principal (nome e senha) depois de um reset de fábrica.
// Roda pelo preset 04_WIFI_RESTORE quando a provision "bootstrap" marca a tag RESTORE_WIFI.
// Só grava se o Wi-Fi estiver no padrão de fábrica (TP-Link_XXXX): um BOOTSTRAP sem reset não altera nada.
const now = Date.now();

function encerrar(msg) {
  log(">>> [WIFI] " + msg);
  declare("Tags.RESTORE_WIFI", null, {value: false});
}

// Só TR-181 (XX530v) por enquanto
if (!declare("Device.WiFi.SSID.*.SSID", {value: 1}).size) {
  encerrar("Modelo sem TR-181 Wi-Fi: restauração automática não suportada");
  return;
}

const serialObj = declare("DeviceID.SerialNumber", {value: 1});
const serial = (serialObj.value && serialObj.value[0]) ? String(serialObj.value[0]) : "";

const dot = (s) => { s = String(s || ""); return s && !s.endsWith(".") ? s + "." : s; };
const isDefault = (s) => /^TP-Link_[0-9A-F]{4}(_5G)?$/i.test(String(s || ""));

// Rede principal de cada faixa: SSID de menor índice em cada rádio + AccessPoint que aponta para ele
const radios = {};
for (const r of declare("Device.WiFi.Radio.*.OperatingFrequencyBand", {value: now})) {
  if (r.value) radios[r.path.slice(0, -"OperatingFrequencyBand".length)] = String(r.value[0]);
}
const prim = {};
for (const s of declare("Device.WiFi.SSID.*.LowerLayers", {value: now})) {
  const band = radios[dot(s.value && s.value[0])];
  if (!band) continue;
  const base = s.path.slice(0, -"LowerLayers".length);
  const idx = Number(base.split(".")[3]);
  if (!prim[band] || idx < prim[band].idx) prim[band] = {idx: idx, ssidPath: base};
}
for (const ap of declare("Device.WiFi.AccessPoint.*.SSIDReference", {value: now})) {
  const ref = dot(ap.value && ap.value[0]);
  for (const b of Object.keys(prim)) if (prim[b].ssidPath === ref) prim[b].apPath = ap.path.slice(0, -"SSIDReference".length);
}

let resetado = false;
for (const b of Object.keys(prim)) {
  const s = declare(prim[b].ssidPath + "SSID", {value: now});
  prim[b].ssid = (s.value && s.value[0]) ? String(s.value[0]) : "";
  if (isDefault(prim[b].ssid)) resetado = true;
}

if (!resetado) {
  encerrar("BOOTSTRAP sem reset de fábrica (Wi-Fi fora do padrão TP-Link_XXXX): nada a restaurar");
  return;
}

const raw = ext("wifibackup", "get", serial);
if (!raw) {
  encerrar("Reset de fábrica detectado em " + serial + ", mas não há Wi-Fi guardado no portal nem no SGP");
  return;
}

let saved = null;
try { saved = JSON.parse(raw); } catch (e) { saved = null; }
if (!saved || !saved.wifi) {
  encerrar("Cópia do Wi-Fi inválida para " + serial);
  return;
}

const restaurados = [];
for (const b of Object.keys(prim)) {
  const w = saved.wifi[b];
  if (!w || !w.ssid || !w.pass || !prim[b].apPath || !isDefault(prim[b].ssid)) continue;
  declare(prim[b].ssidPath + "SSID", {value: now}, {value: [String(w.ssid), "xsd:string"]});
  declare(prim[b].apPath + "Security.KeyPassphrase", {value: now}, {value: [String(w.pass), "xsd:string"]});
  // Não registra a senha no log
  restaurados.push(b + " \"" + w.ssid + "\"");
}

encerrar(restaurados.length
  ? "Wi-Fi restaurado (" + saved.source + "): " + restaurados.join(", ")
  : "Cópia encontrada (" + saved.source + "), mas sem nome e senha completos para as faixas resetadas");
