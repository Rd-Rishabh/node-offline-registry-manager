#!/usr/bin/env node
// 7min 33 sec
// 6min 26 sec
import { execSync } from 'child_process';
var downloaded = new Set();

function getDepTree(packName, semver='latest'){
    let downloadedVersion = downloadTar(packName, semver);
    if (!downloadedVersion) return;

    let downloadedPackage;

    if(String(semver).startsWith('npm:')){
      let pack = extractVersion(semver.split(':')[1]);
      downloadedPackage = `${pack.name}@${downloadedVersion}`;
    } else{
      downloadedPackage = `${packName}@${downloadedVersion}`;
    }
    if (downloaded.has(downloadedPackage)) return;
    downloaded.add(downloadedPackage);

    console.log(`Fetching dependencies for ${downloadedPackage}...`);
    const stdout = execSync(`npm info ${downloadedPackage} dependencies --json`).toString();
    let deps = JSON.parse(stdout || "{}");

    for (const [dep, ver] of Object.entries(deps)) {
      getDepTree(dep, ver);  
    }
    
}

function extractVersion(pkgString) {
  console.log(`Package redirected to ${pkgString}`);
  // const regex = /^(?:@([^/]+)\/)?([^@]+)@([\d.]+)$/;
  const regex = /^(?:@([^/]+)\/)?([^@]+)@(.+)$/;
  const match = pkgString.match(regex);

  if (match) {
      const scope = match[1] || null; // If scoped, capture it
      const name = scope ? `@${scope}/${match[2]}` : match[2];
      const ver = match[3];

      return { name, ver };
  } else {
      throw new Error("Invalid package format. Use 'package@version' or '@scope/package@version'.");
  }
}

function downloadTar(packageName, semver){

  console.log(`Downloading tar for ${packageName}@${semver}...`);
  try {
    
    const stdout = execSync(`npm pack "${packageName}@${semver}" --pack-destination ./tars/`).toString().trim();
  
    // Regex to extract `<package-name>-<version>.tgz`
    const match = stdout.match(/(.+)-([\d.]+)\.tgz$/);
  
    if (match) {
      // const fileName = match[0];
      // const packName = match[1];
      const version = match[2];
      console.log(`Downloaded tar : ${packageName}@${version}`);
      return version;
    } else {
      throw new Error("Failed to parse npm pack output.");
    }
  } catch (error) {
    if (error.message.includes("npm err")) {
      console.error("Error: Package not found. !!");
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }

}

// Get package name from CLI args
const packageName = process.argv[2];
const version = process.argv[3];
if (!packageName) {
  console.error(chalk.red("Usage: node index.js <package-name>"));
  console.error("Usage: node index.js <package-name>");
  process.exit(1);
}

// console.time('Time to get deps:');
// await getDepTree(packageName);
// getMaxSatisfyingVersion("react", "^16.8.0").then(console.log);

// console.timeEnd('Time to get deps:');
// console.log(fullDepList);

// downloadAllTar(packageName, fullDepList);

// let temp=downloadTar(packageName);
// console.log(typeof temp)
// console.log(temp);

console.time('Time to download deps:');
getDepTree(packageName, version)
console.timeEnd('Time to download deps:');
// node src\index.js mongoose
// Time to get deps:: 35.200s
// Time to download deps:: 33.584s
// Total Time : 68.784s