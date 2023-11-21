#!/usr/bin/env node

import { generatePages } from './generate-pages.js'
import { generateDist } from './generate-dist.js'
import { existsSync } from 'fs'

const args = process.argv.slice(2)

if (args.length !== 2) {
    console.error('Usage: node generate.js <content-path> <dist-path>')
    process.exit(1)
}

const [contentPath, distPath] = args

if (!contentPath || !distPath) {
    console.error('Usage: node generate.js <content-path> <dist-path>')
    process.exit(1)
}

if (!existsSync(contentPath)) {
    console.error(`Content path ${contentPath} does not exist`)
    process.exit(1)
}

const pages = generatePages(contentPath, 'My Site')
// console.dir(pages, { depth: null })
generateDist(pages, distPath)

console.log(`Generated pages from ${contentPath}. Saved to ${distPath}.`)
