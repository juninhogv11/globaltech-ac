"use strict";
// Foto por modelo de equipamento (arquivo enviado ou URL externa), guardada em data/models
const fs = require("fs");
const path = require("path");
const { USERS_FILE } = require("./env");

const DIR = path.join(path.dirname(USERS_FILE), "models");
const META = path.join(DIR, "models.json");
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function load() {
  try {
    return JSON.parse(fs.readFileSync(META, "utf8"));
  } catch {
    return {};
  }
}

function save(meta) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(META, JSON.stringify(meta, null, 2));
}

const safeName = (model) => String(model).replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 64) || "modelo";
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

// Confere a assinatura do arquivo, não só o tipo declarado
function sniff(buf) {
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function removeFile(entry) {
  if (entry && entry.type === "file") fs.rmSync(path.join(DIR, entry.file), { force: true });
}

function setFile(model, dataUrl) {
  const m = String(dataUrl || "").match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw bad("Imagem inválida.");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_BYTES) throw bad("Imagem muito grande (máximo 2 MB).");
  const mime = sniff(buf);
  if (!mime) throw bad("Formato não suportado. Use PNG, JPG ou WEBP.");
  const meta = load();
  removeFile(meta[model]);
  const file = `${safeName(model)}-${Date.now()}.${TYPES[mime]}`;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, file), buf);
  meta[model] = { type: "file", file, at: Date.now() };
  save(meta);
}

function setUrl(model, url) {
  let u;
  try {
    u = new URL(String(url || ""));
  } catch {
    throw bad("URL inválida.");
  }
  if (!["http:", "https:"].includes(u.protocol)) throw bad("A URL precisa começar com http:// ou https://");
  const meta = load();
  removeFile(meta[model]);
  meta[model] = { type: "url", url: u.toString(), at: Date.now() };
  save(meta);
}

function remove(model) {
  const meta = load();
  removeFile(meta[model]);
  delete meta[model];
  save(meta);
}

// Endereço que a página usa no <img>
function imageUrl(model) {
  const e = load()[model];
  if (!e) return null;
  return e.type === "url" ? e.url : `/api/models/${encodeURIComponent(model)}/image?v=${e.at}`;
}

function filePath(model) {
  const e = load()[model];
  return e && e.type === "file" ? path.join(DIR, e.file) : null;
}

module.exports = { setFile, setUrl, remove, imageUrl, filePath };
