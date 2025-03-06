#!/usr/bin/env node

// const ls = require("npm-remote-ls").ls;
import { ls, config } from "npm-remote-ls";
import { exec, execSync } from "child_process";
var depList = new Set();


function getDeps(packName){
  console.log(`Fetching deps for ${packName}`);
  const out = execSync(`npx npm-remote-ls ${packName} --flatten`).toString();
  console.log(out);

  // ls('bootstrap', 'latest', true, (obj) => {
  //   console.log(obj);
  // })

  
}
// function getDeps(packName){
//     if (depList.has(packName)) return;

//     console.log(`Fetching deps for ${packName}`);
//     const out = execSync(`npm info ${packName} dependencies --json`).toString();

//     const deps = JSON.parse(out || "{}");
//     console.log(deps);

//     if(!Array.isArray(deps)){
//       for (const dep in deps) {
//         const version = deps[dep].split(" ")[0];
//         getDeps(`${dep}@${version}`);
//         depList.add(`${dep}@${version}`);
//       }
//     }else{
//       const rerun = execSync(`npm info ${packName} dependencies --json`).toString().split('\n');
//       rerun.forEach(element => {
        
//       });
//     }


//     // console.log(depList);
// }


// // Function to fetch dependencies recursively
// async function getAllDependencies(packageName) {
//   if (depList.has(packageName)) return;
//   console.log(`Fetching dependencies for ${packageName}...`);
  
  
//   return new Promise((resolve) => {
//     exec(`npm info ${packageName} dependencies --json`, (error, stdout, stderr) => {

//       if (error || stderr) {
//         console.error(`Error fetching ${packageName}`);
//         resolve();
//         return;
//       }

//       let dependencies;
//       try {
//         dependencies = JSON.parse(stdout || "{}");
//       } catch (err) {
//         console.error(`Failed to parse dependencies for ${packageName}`);
//         resolve();
//         return;
//       }

//       Object.entries(dependencies).forEach(async ([dep, version]) => {
//           await getAllDependencies(`${dep}@${version}`); // Recursively fetch deps
//           depList.add(`${dep}@${version}`);
//         });

//       resolve();
//     });
//   });
// }


// Get package name from CLI args
const packageName = process.argv[2];

if (!packageName) {
  // console.error(chalk.red("Usage: node index.js <package-name>"));
  console.error("Usage: node index.js <package-name>");
  process.exit(1);
}

getDeps(packageName);
// await getAllDependencies(packageName);
console.log(depList);