"use strict";
// Teste de velocidade pelo próprio roteador (TR-143 Download/UploadDiagnostics)
const crypto = require("crypto");
const nbi = require("./nbi");

const DOWNLOAD_URL = process.env.SPEEDTEST_DOWNLOAD_URL || "http://acs.exemplo.com.br/100MB.bin";
const UPLOAD_BASE = (process.env.SPEEDTEST_UPLOAD_BASE || "http://192.168.10.3:8080/speedtest/upload").replace(/\/+$/, "");
const UPLOAD_BYTES = Number(process.env.SPEEDTEST_UPLOAD_BYTES || 100 * 1024 * 1024);
const MAX_WAIT_MS = 150000;

function get(doc, path) {
  let o = doc;
  for (const k of path.split(".")) {
    if (o == null) return undefined;
    o = o[k];
  }
  return o;
}
const val = (doc, path) => {
  const o = get(doc, path);
  return o && o._value !== undefined ? o._value : undefined;
};

function bases(doc) {
  return doc.Device
    ? { download: "Device.IP.Diagnostics.DownloadDiagnostics", upload: "Device.IP.Diagnostics.UploadDiagnostics" }
    : { download: "InternetGatewayDevice.DownloadDiagnostics", upload: "InternetGatewayDevice.UploadDiagnostics" };
}

const validIp = (ip) => ip && ip !== "0.0.0.0" && !ip.startsWith("127.") && !ip.startsWith("192.168.") && !ip.startsWith("169.254.");

// Interface WAN que o teste deve usar
function wanInterface(doc) {
  if (doc.Device) {
    const ifs = get(doc, "Device.IP.Interface") || {};
    for (const [i, itf] of Object.entries(ifs)) {
      if (!/^\d+$/.test(i)) continue;
      for (const [j, a] of Object.entries(itf.IPv4Address || {})) {
        if (/^\d+$/.test(j) && validIp(val(a, "IPAddress"))) return `Device.IP.Interface.${i}`;
      }
    }
    return "";
  }
  const wd = get(doc, "InternetGatewayDevice.WANDevice") || {};
  for (const [i, d] of Object.entries(wd)) {
    if (!/^\d+$/.test(i)) continue;
    for (const [j, cd] of Object.entries(d.WANConnectionDevice || {})) {
      if (!/^\d+$/.test(j)) continue;
      for (const kind of ["WANPPPConnection", "WANIPConnection"]) {
        for (const [k, c] of Object.entries(cd[kind] || {})) {
          if (/^\d+$/.test(k) && validIp(val(c, "ExternalIPAddress"))) {
            return `InternetGatewayDevice.WANDevice.${i}.WANConnectionDevice.${j}.${kind}.${k}`;
          }
        }
      }
    }
  }
  return "";
}

// Resultado gravado no ACS para um tipo (download/upload)
function result(doc, type) {
  const base = bases(doc)[type];
  const o = get(doc, base);
  if (!o) return { supported: false };
  const state = val(o, "DiagnosticsState") || "";
  const bom = Date.parse(val(o, "BOMTime") || "");
  const eom = Date.parse(val(o, "EOMTime") || "");
  const bytes = type === "download"
    ? Number(val(o, "TestBytesReceived") || 0) || Number(val(o, "TotalBytesReceived") || 0)
    : Number(val(o, "TestBytesSent") || 0) || Number(val(o, "TotalBytesSent") || 0) || Number(val(o, "TestFileLength") || 0);
  const seconds = Number.isFinite(bom) && Number.isFinite(eom) && eom > bom && bom > 0 ? (eom - bom) / 1000 : 0;
  const done = state === "Completed" && seconds > 0 && bytes > 0;
  return {
    supported: true,
    state,
    at: (o.DiagnosticsState && o.DiagnosticsState._timestamp) || null,
    mbps: done ? Math.round((bytes * 8) / seconds / 10000) / 100 : null,
    seconds: done ? Math.round(seconds * 100) / 100 : null,
    bytes: done ? bytes : null,
  };
}

function info(doc) {
  return { download: result(doc, "download"), upload: result(doc, "upload") };
}

// ---------- Receptor do upload (o roteador envia por HTTP PUT) ----------
const tokens = new Map();

function newToken(deviceId) {
  const token = crypto.randomBytes(16).toString("hex");
  tokens.set(token, { deviceId, expires: Date.now() + MAX_WAIT_MS + 60000, bytes: 0 });
  return token;
}

// Chamado pelo servidor HTTP para /speedtest/upload/<token> (sem login: quem envia é o roteador)
function handleUpload(req, res, token) {
  const t = tokens.get(token);
  if (!t || t.expires < Date.now() || !["PUT", "POST"].includes(req.method)) {
    res.writeHead(403, { Connection: "close" });
    res.end();
    req.resume();
    return;
  }
  const t0 = Date.now();
  let got = 0;
  if (process.env.SPEEDTEST_DEBUG) {
    console.log(`upload inicio ${req.method} ip=${req.ip} headers=${JSON.stringify(req.headers)}`);
    req.on("close", () => console.log(`upload close: ${got} bytes em ${Date.now() - t0} ms complete=${req.complete}`));
  }
  req.on("data", (c) => { got += c.length; t.bytes += c.length; });
  req.on("end", () => {
    if (process.env.SPEEDTEST_DEBUG) {
      console.log(`upload ${req.method} ${got} bytes em ${Date.now() - t0} ms; content-length=${req.headers["content-length"]} te=${req.headers["transfer-encoding"] || ""} expect=${req.headers.expect || ""}`);
    }
    res.statusCode = 200;
    res.end("OK");
  });
  req.on("error", () => {});
}

// ---------- Execução em segundo plano ----------
const jobs = new Map();
const running = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start(deviceId, type, user) {
  if (running.has(deviceId)) {
    throw Object.assign(new Error("Já existe um teste de velocidade em andamento neste equipamento."), { status: 409 });
  }
  const job = { id: crypto.randomBytes(8).toString("hex"), deviceId, type, user, state: "starting", message: "Preparando o teste…", result: null, startedAt: new Date().toISOString() };
  jobs.set(job.id, job);
  running.set(deviceId, job.id);
  run(job).catch((e) => {
    job.state = "error";
    job.message = e.message;
  }).finally(() => {
    running.delete(deviceId);
    setTimeout(() => jobs.delete(job.id), 15 * 60000);
  });
  return job;
}

async function run(job) {
  let doc = await nbi.device(job.deviceId);
  const base = bases(doc)[job.type];
  if (!get(doc, base)) throw new Error("Este equipamento não informa suporte a esse teste.");
  // Primeiro teste no aparelho: lê o objeto para saber quantas conexões ele aceita
  const maxPath = base + (job.type === "download" ? ".DownloadDiagnosticMaxConnections" : ".UploadDiagnosticsMaxConnections");
  if (doc.Device && val(doc, maxPath) === undefined) {
    job.message = "Lendo capacidades do roteador…";
    await nbi.task(job.deviceId, { name: "refreshObject", objectName: base }, 15000).catch(() => {});
    doc = await nbi.device(job.deviceId);
  }
  const itf = wanInterface(doc);
  if (!itf) throw new Error("Não encontrei a interface WAN com IP. Clique em \"Atualizar agora\" e tente de novo.");

  const params = [[base + ".Interface", itf, "xsd:string"]];
  if (job.type === "download") {
    params.push([base + ".DownloadURL", DOWNLOAD_URL, "xsd:string"]);
  } else {
    params.push([base + ".UploadURL", `${UPLOAD_BASE}/${newToken(job.deviceId)}`, "xsd:string"]);
    params.push([base + ".TestFileLength", UPLOAD_BYTES, "xsd:unsignedInt"]);
  }
  // Várias conexões simultâneas dão um resultado mais próximo da velocidade real do plano
  const max = Number(val(doc, maxPath) || 0);
  if (doc.Device && max > 1) params.push([base + ".NumberOfConnections", Math.min(max, 3), "xsd:unsignedInt"]);
  params.push([base + ".DiagnosticsState", "Requested", "xsd:string"]);

  // BOMTime do teste anterior: só aceita resultado com marca de tempo diferente (evita mostrar teste velho)
  const prevBom = val(doc, base + ".BOMTime") || "";

  job.state = "running";
  job.message = job.type === "download" ? "Baixando arquivo de teste no roteador…" : "Enviando arquivo de teste a partir do roteador…";
  const r = await nbi.task(job.deviceId, { name: "setParameterValues", parameterValues: params }, 20000);
  if (r.status === 202) job.message = "Equipamento não respondeu agora; o teste começa no próximo inform…";

  const until = Date.now() + MAX_WAIT_MS;
  while (Date.now() < until) {
    await sleep(8000);
    await nbi.task(job.deviceId, { name: "refreshObject", objectName: base }, 15000).catch(() => {});
    const fresh = await nbi.device(job.deviceId);
    const res = result(fresh, job.type);
    const bom = val(fresh, base + ".BOMTime") || "";
    if (res.state === "Completed" && bom === prevBom) continue;
    if (res.state && res.state !== "Requested" && res.state !== "None") {
      if (res.state === "Completed" && res.mbps !== null) {
        job.state = "done";
        job.result = res;
        job.message = `${job.type === "download" ? "Download" : "Upload"}: ${res.mbps} Mbps`;
      } else {
        job.state = "error";
        job.message = `O roteador terminou com erro: ${res.state}`;
      }
      console.log(new Date().toISOString(), `speedtest ${job.type} ${job.deviceId} por ${job.user}: ${job.message}`);
      return;
    }
  }
  job.state = "error";
  job.message = "Tempo esgotado esperando o resultado do roteador.";
}

function getJob(id) {
  return jobs.get(id) || null;
}

function runningJob(deviceId) {
  const id = running.get(deviceId);
  return id ? jobs.get(id) : null;
}

// Remove códigos de upload vencidos
setInterval(() => {
  const now = Date.now();
  for (const [t, v] of tokens) if (v.expires < now) tokens.delete(t);
}, 5 * 60000).unref();

module.exports = { info, start, getJob, runningJob, handleUpload };
