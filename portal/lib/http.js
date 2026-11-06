"use strict";
// Roteador HTTP mínimo sobre node:http (evita instalar npm/express no servidor)
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

function createRouter() {
  const routes = [];
  const add = (method) => (pattern, ...handlers) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "/?$");
    routes.push({ method, re, keys, handlers });
  };
  return {
    get: add("GET"),
    post: add("POST"),
    delete: add("DELETE"),
    match(method, pathname) {
      for (const r of routes) {
        if (r.method !== method) continue;
        const m = pathname.match(r.re);
        if (m) {
          const params = {};
          r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
          return { handlers: r.handlers, params };
        }
      }
      return null;
    },
  };
}

// Acrescenta ao res os métodos usados pelos handlers: status(), json(), set()
function decorate(req, res) {
  res.status = (code) => ((res.statusCode = code), res);
  res.set = (headers) => {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    return res;
  };
  res.json = (data) => {
    const body = JSON.stringify(data);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(body);
  };
  req.get = (name) => req.headers[name.toLowerCase()];
  // Atrás do nginx local, o IP real vem em X-Forwarded-For
  const remote = req.socket.remoteAddress || "";
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  req.ip = (remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1") && fwd ? fwd : remote;
}

function readJson(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers["content-type"] || "").includes("application/json")) return resolve({});
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error("Corpo da requisição muito grande"), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(Object.assign(new Error("JSON inválido"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

// 304 quando o navegador já tem a mesma versão do arquivo
function req_ims(res, st) {
  const ims = res.req && res.req.headers["if-modified-since"];
  return ims && Math.floor(st.mtimeMs / 1000) <= Math.floor(new Date(ims).getTime() / 1000);
}

function sendFile(res, file, maxAge = 0) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.statusCode = 404;
      return res.end("Não encontrado");
    }
    // maxAge 0 = navegador sempre confere com o servidor (evita usar app.js antigo após atualização)
    res.setHeader("Cache-Control", maxAge > 0 ? `public, max-age=${maxAge}` : "no-cache");
    res.setHeader("Last-Modified", st.mtime.toUTCString());
    if (req_ims(res, st)) {
      res.statusCode = 304;
      return res.end();
    }
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.setHeader("Content-Length", st.size);
    fs.createReadStream(file).pipe(res);
  });
}

function serveStatic(root, pathname, res) {
  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const file = path.resolve(root, rel);
  if (!file.startsWith(path.resolve(root) + path.sep)) {
    res.statusCode = 403;
    return res.end("Proibido");
  }
  sendFile(res, file);
}

module.exports = { createRouter, decorate, readJson, sendFile, serveStatic };
