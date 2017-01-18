'use strict';

const google = require('googleapis');
const googleAuth = require('google-auth-library');
const fs = require('fs');
const read = require('read');

function Spreadsheet(options) {
  this.options = options;

  const client = this.options.client;

  const auth = new googleAuth();
  this.oauth2 = new auth.OAuth2(client.client_id, client.client_secret,
                                client.redirect_uris[0]);

  this.initQueue = [];
  this.init();
}
module.exports = Spreadsheet;

Spreadsheet.prototype.init = function init() {
  if (fs.existsSync(this.options.token)) {
    const token = JSON.parse(fs.readFileSync(this.options.token).toString());
    this.oauth2.setCredentials(token);
    return this.onAuth();
  }

  const url = this.oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: [ 'https://www.googleapis.com/auth/spreadsheets' ]
  })

  console.error(`Authorize app: ${url}`);
  read({ prompt: 'Enter code: ', output: process.stderr }, (err, code) => {
    if (err)
      throw err;

    this.oauth2.getToken(code, (err, token) => {
      if (err)
        throw err;

      this.oauth2.setCredentials(token);
      this.storeToken(token);
      this.onAuth();
    });
  });
};

Spreadsheet.prototype.storeToken = function storeToken(token) {
  fs.writeFileSync(this.options.token, JSON.stringify(token));
};

Spreadsheet.prototype.onAuth = function onAuth() {
  const queue = this.initQueue;
  this.initQueue = null;

  queue.forEach(item => item());
};

Spreadsheet.prototype.append = function append(line, callback) {
  if (this.initQueue !== null) {
    this.initQueue.push(() => this.append(line, callback));
    return;
  }

  const sheets = google.sheets('v4');

  sheets.spreadsheets.values.append({
    auth: this.oauth2,

    spreadsheetId: this.options.id,
    range: 'Sheet1!A1:A1',
    valueInputOption: 'RAW',
    resource: {
      values: [[ line ]]
    },
  }, callback);
};
