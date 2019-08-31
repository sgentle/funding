const lifecycle = require('./index.js')
const path = require('path')
const fs = require('fs')
let sqlite3
try {
  sqlite3 = require('better-sqlite3')
}
catch {
  module.exports = lifecycle
  return
}

const PROFILE = '{{PROFILE}}'

const dbfile = path.join(PROFILE, 'publisher_info_db')
const db = sqlite3(dbfile);

const ledgerfile = path.join(PROFILE, 'ledger_state')
const ledger = JSON.parse(fs.readFileSync(ledgerfile))
const {reconcileStamp} = ledger

const addActivity = db.prepare(`
    INSERT INTO activity_info (publisher_id, reconcile_stamp, visits, duration, score, weight, percent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(publisher_id, reconcile_stamp) DO UPDATE
          SET visits = visits + excluded.visits,
              duration = (duration + excluded.duration),
              score = (score + excluded.score),
              weight = (weight + excluded.weight),
              percent = (percent + excluded.percent)
`)

const addPublisher = db.prepare(`
  INSERT OR IGNORE INTO publisher_info (publisher_id, name, url, provider, favIcon)
    VALUES (?, ?, ?, ?, ?)
`)


const updatePackage = (name) => {
  const id = `npm#channel:${name}`
  const url = `https://www.npmjs.com/package/${name}`

  addPublisher.run(id, name, url, '', '')
  addActivity.run(id, reconcileStamp, 1, 10, 1, 1, 1)
}

module.exports = (...args) => {
  const [pkg, stage, wd, opts] = args
  const name = pkg.name
  if (name && stage === 'postinstall') {
    updatePackage(name)
  }
  return lifecycle(...args)
}
