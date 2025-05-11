import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from "path";
import { execSync } from "child_process";
import { performance } from "perf_hooks";
import prettyMs from "pretty-ms";
import { simplifyPackageName } from "./utils.js";


function packOffline(packageName, version='latest', options) {
    
    let execStartTime, execEndtime;
    execStartTime = performance.now();
    
    const dirName = simplifyPackageName(`${packageName}-${version}`);
    try {
        // Checks and creates directory
        (!existsSync(dirName)) && mkdirSync(dirName, { recursive: true });
        const out = execSync(`cd "${dirName}" && npm install --cache ${join('.','npm-cache')} --prefer-offline --no-bin-links --no-audit --no-fund "${packageName}@${version}"`, {stdio : "pipe"}).toString();
        options.verbose && console.log(out);
        console.log(`Downloaded ${packageName}@${version} in directory ${dirName}`);
        console.log(`Copy this folder to offline machine and use "install-offline" command for installation.`);
    } catch (error) {
        (existsSync(dirName)) && rmSync(dirName, { recursive: true });
        console.error(`Failed to download ${packageName}@${version}!!`);
        !options.verbose && console.log('Use verbose(-v) option for detailed output');
        options.verbose && console.log(error.stderr.toString());
    }

    execEndtime = performance.now();
    console.log(`Total time taken is ${prettyMs(execEndtime - execStartTime)}`);

}


function installOffline(directory, options){
    let execStartTime, execEndtime;
    execStartTime = performance.now();
    
    if(existsSync(directory)){
        try {
            const pkgJsonPath = resolve(join(directory, 'package.json'));            
            const { dependencies } = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
            
            Object.keys(dependencies).forEach(pkgName=>{
                const ver = dependencies[pkgName];
                const out = execSync(`npm install ${options.global ? '-g' : ''} --cache "${join(directory,'npm-cache')}" --offline --no-fund "${pkgName}@${ver}"`
                                , {stdio : "pipe"}).toString();
                options.verbose && console.log(out);
                console.log(`Installed ${pkgName}@${ver} from directory ${directory} ${options.global ? 'globally' : ''}.`);
            });
            
            execEndtime = performance.now();
            console.log(`Total time taken is ${prettyMs(execEndtime - execStartTime)}`);
        } catch (error) {
            console.log(error.message);
        }
    }else {
        console.error(`Error: Unable to locate directory "${directory}"`);     
    }
}


export { packOffline, installOffline };