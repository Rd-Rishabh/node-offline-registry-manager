import { readdirSync, createWriteStream } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { performance } from "perf_hooks";
import prettyMs from "pretty-ms";
import config from '../config.js';


export function publishTarballs(directory, options) {

  let execStartTime, execEndtime;
  execStartTime = performance.now();
  let registryUrl;
  try {
    registryUrl = execSync(`npm config get registry`).toString().trim();
  } catch (error) {
    console.error(`Failed to fetch registry :`, error.message);
  }

  if(config.npmRegistryUrl === registryUrl) {
    console.error(`Your default registry is set to ${config.npmRegistryUrl}. Cannot publish to npm registry !!`);
    return;
  }

  try {
    const files = readdirSync(directory);
    const tarballs = files.filter(file => file.endsWith(".tgz"));
    let failed = new Map(), counter=1;
    // console.log(tarballs);
    if (tarballs.length === 0) {
      console.log("No tarballs found in the directory.");
      return;
    }
    console.log(`${tarballs.length} tarballs found in the directory.`);
    
    
    tarballs.forEach(tarball => {
      const tarballPath = join(directory, tarball);
      console.log(`Publishing ${tarball} [${counter++} of ${tarballs.length}]...`);
      try {
        const out = execSync(`npm publish --registry=${registryUrl} --provenance=false ${tarballPath} `, {stdio : "pipe"}).toString();
        options.verbose && console.log(out);
        console.log(`${tarball} published successfully.`);
      } catch (error) {
        console.error(`Failed to publish ${tarball} !!`);
        options.verbose && console.log(error.stderr.toString());
        failed.set(tarball, error.stderr.toString());
      }
    });

    console.log(`Total ${tarballs.length - failed.size} of ${tarballs.length} tarballs have been published to ${registryUrl}.`);

    // Creating error.log file
    (failed.size > 0) && createErrorLog(failed, directory);

  } catch (error) {
    console.error("Error reading directory:", error.message);
  }
  execEndtime = performance.now();
  console.log(`Total time taken is ${prettyMs(execEndtime - execStartTime)}`);

}

function createErrorLog(failed, directory){
  const logFile = join(directory,'publish_error.log');
  const logStream = createWriteStream(join(directory,'publish_error.log'));
  let counter = 1;
  logStream.write('=========================================================================================================================================\n');
  logStream.write('Details of unpublished tarballs.\n');
  logStream.write(`${new Date()}\n`);
  logStream.write('=========================================================================================================================================\n');
  for(const [tarBall, error] of failed.entries()){
    logStream.write(`${counter++}. ${tarBall}\n`);
    logStream.write(`Error:\n`);
    error.split('\n').forEach((line)=>{
      if(line.toLowerCase().startsWith('npm err')){
        logStream.write(`${line}\n`);
      }
    });
    logStream.write('=========================================================================================================================================\n');
  }
  logStream.end();
  console.log(`Details of unpublished files are logged in ${logFile}`);

}

