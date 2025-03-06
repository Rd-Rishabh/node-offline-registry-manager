#!/usr/bin/env node

import { execSync } from 'child_process';
import { maxSatisfying } from 'semver';
var fullDepList = new Set();

async function getDepTree(packageName){
    if(fullDepList.has(packageName)) return;

    console.log(`Fetching dependencies for ${packageName}...`);
    const stdout = execSync(`npm info ${packageName} dependencies --json`).toString();
    let deps = JSON.parse(stdout || "{}");

    // Object.entries(deps).forEach(async ([dep, version]) => {
    //     let finalVer = await getMaxSatisfyingVersion(dep,version);
    //     console.log(finalVer);
    //     console.log(`${dep}@${version}`);
    //     fullDepList.add(`${dep}@${finalVer}`);    
    // });

    for (const [dep, version] of Object.entries(deps)) {
        let finalVer = await getMaxSatisfyingVersion(dep, version);
        // console.log(finalVer);
        // console.log(`${dep}@${version}`);
        await getDepTree(`${dep}@${finalVer}`);
        fullDepList.add(`${dep}@${finalVer}`);
    }
    
}

async function getMaxSatisfyingVersion(packageName, versionRange) {
    // try {
    //   const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    //   const data = await response.json();
  
    //   const versions = Object.keys(data.versions); // Get all available versions
  
    //   const maxVersion = semver.maxSatisfying(versions, versionRange);
      
    //   return maxVersion ? maxVersion : "latest";
    // } catch (error) {
    //   console.error("Error fetching package data:", error);
    // }

    try {
      console.time('ver time');
        const response = await fetch(`https://registry.npmjs.org/${packageName}`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
        const data = await response.json();
      console.timeEnd('ver time');
        const versions = Object.keys(data.versions); // Get all available versions
        const maxVersion = maxSatisfying(versions, versionRange);
        maxVersion ? maxVersion : console.log(`No matching version found for ${versionRange}`);
        return maxVersion || "latest";
      } catch (error) {
        console.error("Error:", error);
      }
}

function downloadAllTar(packageName, depList = new Set()){

  downloadTar(packageName);
  depList.forEach(downloadTar);

  function downloadTar(packageName){
    console.log(`Downloading tar for ${packageName}...`);
    const stdout = execSync(`npm pack ${packageName} --pack-destination ./tars/`);
    console.log(stdout);
  }
}


// Get package name from CLI args
const packageName = process.argv[2];

if (!packageName) {
  console.error(chalk.red("Usage: node index.js <package-name>"));
  console.error("Usage: node index.js <package-name>");
  process.exit(1);
}

console.time('Time to get deps:');
await getDepTree(packageName);
// getMaxSatisfyingVersion("react", "^16.8.0").then(console.log);

console.timeEnd('Time to get deps:');
console.log(fullDepList);

console.time('Time to download deps:');
downloadAllTar(packageName, fullDepList);
console.timeEnd('Time to download deps:');

// node src\index.js mongoose
// Time to get deps:: 35.200s
// Time to download deps:: 33.584s
// Total Time : 68.784s