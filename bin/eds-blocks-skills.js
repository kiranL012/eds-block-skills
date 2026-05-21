#!/usr/bin/env node
'use strict';

const { run } = require('../src/create-block.js');

const command = process.argv[2];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`
  eds-blocks-skills CLI

  Usage:
    npx eds-blocks-skills create    Scaffold a new EDS block interactively
    npx eds-blocks-skills help      Show this help message
  `);
  process.exit(0);
}

if (command === 'create') {
  run().catch(err => {
    console.error('\n  Error:', err.message);
    process.exit(1);
  });
} else {
  console.error(`  Unknown command: "${command}". Run "eds-blocks help" for usage.`);
  process.exit(1);
}
