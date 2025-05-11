#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { packTars } from '../src/download.js';
import { publishTarballs } from '../src/publish.js';
import { installOffline, packOffline } from '../src/offline.js';


// Read version from own package.json file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgJsonPath = path.resolve(__dirname, '../package.json');
const { version } = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

const program = new Command();

program
  .name('pack-pub')
  .description('A CLI tool for packing and publishing npm packages with dependencies.\nMainly useful for managing offline registries like verdaccio')
  .version(version);

// `pack-tars` command
program
  .command('pack-tars <packageName> [version]')
  .description('Download npm tarballs for a package and its dependencies.')
  .option('-v, --verbose', 'gives detailed output')
  .action((packageName, version, options) => {
    packTars(packageName, version, options)
  });
  
  // `publish-tars` command
  program
  .command('publish-tars <directory>')
  .description('Publish tarballs from a directory to an offline registry.')
  // .option('-r, --registry <url>', 'registry URL to publish to')
  .option('-v, --verbose', 'gives detailed output')
  .action(publishTarballs);
  
  // `pack-offline` command
  program
  .command('pack-offline <packageName> [version]')
  .description('Prepare packages for offline use without need of a registry.')
  .option('-v, --verbose', 'gives detailed output')
  .action((packageName, version, options) => {
    packOffline(packageName, version, options);
  });
  
  // `install-offline` command
  program
  .command('install-offline <directory>')
  .description('Install package from directory created using "pack-offline" command')
  .option('-g, --global', 'installs the package globally')
  .option('-v, --verbose', 'gives detailed output')
  .action((directory, options) => {
    installOffline(directory, options)
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}