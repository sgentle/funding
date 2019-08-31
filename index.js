#!/usr/bin/env node
const path = require('path')
const os = require('os')
const fs = require('fs')
const util = require('util')
const _exec = require('child_process').execSync
const exec = (cmd) => _exec(cmd, {encoding: 'utf8'}).trim()

if (require.main !== module) return

if (!process.argv[2] || process.argv[3]) {
  const example = `${os.homedir}/Library/Application Support/BraveSoftware/Brave-Browser/Default`
  console.warn(`
Usage: funding <Brave profile directory>
  (eg '${example}' on OSX)

  This will monkey-patch your npm to add any node modules you install to the
  contribution list in Brave Rewards.
`.trim())

  process.exit(1)
}

const PROFILE = process.argv[2]

console.log('Monkeying around with npm-lifecycle...')
const npmRoot = exec('npm root -g')
process.chdir(path.join(npmRoot, 'npm', 'node_modules', 'npm-lifecycle'))

console.log('Installing sqlite (this might take a while)...')
exec('npm install better-sqlite3')

console.log('Writing global hook...')
const template = fs.readFileSync(path.join(__dirname, 'patch.template.js'), 'utf8')
fs.writeFileSync('./index-patch.js', template.replace('{{PROFILE}}', PROFILE))

console.log('Patching package.json...')
const pkg = JSON.parse(fs.readFileSync('./package.json'))
pkg.main = 'index-patch.js'
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))

console.log('Reticulating splines...')

console.log('Done!')
