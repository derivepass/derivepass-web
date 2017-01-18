'use strict';

const http = require('http');
const util = require('util');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const pow = require('proof-of-work');

const Spreadsheet = require('./spreadsheet');

function Server(options) {
  http.Server.call(this);

  this.log = options.log;
  this.files = new Map();
  this.doc = new Spreadsheet(options.spreadsheet);

  this.powVerifier = new pow.Verifier(options['proof-of-work']);

  setInterval(() => {
    this.powVerifier.reset();
  }, options['proof-of-work'].interval);

  [
    'index.html',
    'favicon.png',
    'main.js',
    'app.png',
    'app-2x.png',
    'app-store.png',
    'app-store-2x.png'
  ].forEach((name) => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'public', name));
    const hash = crypto.createHash('sha256').update(content).digest('base64');
    const etag = `"${hash}"`;

    let mime;
    if (/\.html$/.test(name))
      mime = 'text/html';
    else if (/\.png$/.test(name))
      mime = 'image/png';
    else if (/\.js$/.test(name))
      mime = 'application/javascript';
    else
      throw new Error(`Unknown file type ${name}`);

    const file = {
      etag: etag,
      mime: mime,
      content: content,
      deflate: zlib.deflateSync(content),
      gzip: zlib.gzipSync(content)
    };

    if (name === 'index.html')
      this.files.set('/', file);
    else
      this.files.set('/' + name, file);
  });

  this.on('request', this.onRequest);
}
module.exports = Server;
util.inherits(Server, http.Server);

Server.prototype.serveStatic = function serveStatic(req, res) {
  const file = this.files.get(req.url);

  if (req.headers['if-none-match'] === file.etag) {
    res.writeHead(304);
    res.end();
    return;
  }

  const inEnc = req.headers['accept-encoding'];
  let outEnc;
  let content;
  if (/gzip/.test(inEnc)) {
    content = file.gzip;
    outEnc = 'gzip';
  } else if (/deflate/.test(inEnc)) {
    content = file.deflate;
    outEnc = 'deflate';
  } else {
    content = file.content;
    outEnc = undefined;
  }

  res.writeHead(200, {
    'content-type': file.mime,
    'cache-control': 'public, must-revalidate, max-age=0',
    etag: file.etag,
    'content-encoding': outEnc,
  });
  res.end(content);
};

Server.prototype.serveAPI = function serveAPI(req, res) {
  if (!req.headers['x-proof-of-work'] ||
      !this.powVerifier.check(Buffer.from(req.headers['x-proof-of-work'],
                                          'base64'))) {
    res.writeHead(400);
    res.end('Invalid proof-of-work nonce');
    return;
  }

  const MAX_CONTENT = 1024;
  let content = '';

  req.on('data', (chunk) => {
    content += chunk;
    if (content.length > MAX_CONTENT) {
      req.destroy();
      return;
    }
  });

  req.on('end', () => {
    let body;

    try {
      body = JSON.parse(content);
    } catch (e) {
      res.writeHead(400);
      res.end('Invalid JSON');
      return;
    }

    // email is required
    if (!body.email || typeof body.email !== 'string') {
      res.writeHead(400);
      res.end('Invalid body');
      return;
    }

    if (!/^[^@\s]+@[^\.@\s]+\.[^@\s]+$/.test(body.email)) {
      res.writeHead(400);
      res.end('Invalid email');
      return;
    }

    this.storeEmail(body.email);

    res.writeHead(200, {
      'content-type': 'application/json'
    });
    res.end('{"ok":true}');
  });
};

Server.prototype.onRequest = function onRequest(req, res) {
  if (this.files.has(req.url))
    return this.serveStatic(req, res);

  if (req.url !== '/api/subscribe') {
    res.writeHead(404);
    return res.end('Not Found');
  }

  this.serveAPI(req, res);
};

Server.prototype.storeEmail = function storeEmail(email) {
  if (this.log)
    fs.appendFile(this.log, email + '\n');

  this.doc.append(email, () => {});
};
