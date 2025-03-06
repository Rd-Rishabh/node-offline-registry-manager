#!/usr/bin/env node

const ls = require("npm-remote-ls").ls;
const execSync = require("child_process").execSync;
var depList;
// Function to get full dependency tree
function getDependencyTree(packageName) {
    // let dependencies = new Set();
    console.log(`\nFetching Dependencies for ${packageName}. Please be patient, it may take several minutes... \n`);
    ls(packageName, "latest", true, (deps) => {
        depList = new Set(deps);
        // console.log(depList);
        console.log(`\nTotal Dependencies Found: ${depList.size - 1}`);
        Array(depList).forEach(element => {
            downloadTar(element);
        });
    });
}

function downloadTar(packageName) {
    console.log(`\nDownloading Tar for ${packageName}...`);
    const out = execSync(`npm pack ${packageName} --pack-destination ./tars/`).toString();
    console.log(out);
}

// Get package name from CLI arguments
const packageName = process.argv[2];

if (!packageName) {
  // console.error(chalk.red("Usage: node index.js <package-name>"));
  console.error(("Usage: node index.js <package-name>"));
  process.exit(1);
}

getDependencyTree(packageName);
