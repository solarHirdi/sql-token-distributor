/* eslint-disable no-console, no-use-before-define, no-inline-comments, no-plusplus */

const fs = require('fs');
const mysql = require('mysql');
const CONFIG = require('dotenv').config().parsed;
const Log = require('./log');


const connection = mysql.createConnection({
  host: CONFIG.HOST,
  user: CONFIG.USER,
  password: CONFIG.PASSWORD,
  database: CONFIG.DATABASE
});

const call = query => new Promise((resolve, reject) => {
  connection.query(query, function (error, results, fields) {
    if (error) {
      reject(error);
    } else {
      resolve({results, fields});
    }
  });
});

const processList = async list => {
  const created = 1541685600000;
  const scheduled = 1541685600000;
  const from_type = 0; // system
  const to_type = 1; // account
  const type = 13; // charge
  const msg = 'AirDrop';
  const state = 1; // scheduled
  const currency_id = 1; // token

  for (const item of list) {
    const log = new Log();
    const {id, login, amount} = item;
    if (!/^[a-zA-Z0-9]{3,}$/.test(login)) {
      log.error(`# ${id}, login: "${login}", amount: ${amount}. Login does not pass regexp test.`);
      continue;
    }
    const query = `
      INSERT INTO txs (\`created\`, \`scheduled\`,\`from_type\`, \`to_type\`, \`to_id\`, \`type\`, \`msg\`, \`state\`, \`currency_id\`, \`amount\`)
      SELECT
        ${created},
        ${scheduled},
        ${from_type},
        ${to_type},
        id,
        ${type},
        '${msg}',
        ${state},
        ${currency_id},
        ${amount * 100}
      FROM accounts WHERE (id IS NOT NULL AND login = '${login}')
    `;
    try {
      const {results: {insertId}} = await call(query);
      if (insertId) {
        log.success(`# ${id}, login: "${login}", amount: ${amount}, tx_id: ${insertId}`);
      } else {
        log.error(`# ${id}, login: "${login}", amount: ${amount}. Account not found.`);
      }
    } catch (e) {
      log.error(`# ${id}, login: "${login}", amount: ${amount}. SQL ${e}`);
    }
  }
};

const list = JSON.parse(fs.readFileSync('./list.json', 'utf8'));

const run = async () => {
  connection.connect();
  await processList(list);
  connection.end();
};

return run();

/* eslint-enable no-console, no-use-before-define */
