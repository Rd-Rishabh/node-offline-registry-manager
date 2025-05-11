import { get } from 'https';
import { existsSync, mkdirSync, createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { maxSatisfying } from 'semver';
import prettyMs from 'pretty-ms';
import { extractVersion, simplifyPackageName } from './utils.js';
import config from '../config.js';

const downloadList = new Map();
const metadataMap = new Map();
export let timeAtStart, timeAfterFetching, timeAfterDownloading, options;

/**
 * Fetch package metadata from the npm registry.
 */
function fetchPackageMetadata(packageName) {

    if(metadataMap.has(packageName)){
        return metadataMap.get(packageName);
    } else {
        return new Promise((resolve, reject) => {
            get(`${config.npmRegistryUrl}${packageName}`, (res) => {
                let data = '';
    
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const metadata = JSON.parse(data);
                        if (metadata.error) {
                            return reject(new Error(`Package not found: ${packageName}`));
                        }
                        metadataMap.set(packageName, {
                            "versions": metadata.versions,
                            "distTags": metadata['dist-tags'],
                        });
                        resolve(metadataMap.get(packageName));
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
    }

}


/**
 * Resolve dist tags for version.
 */
function resolveDistTags(version, distTags) {
    if(Object.keys(distTags).includes(version)) return distTags[version];

    return version;
}

/**
 * Recursively fetch dependencies and adds to download list.
 */
async function fetchDependenciesTree(packageName, version) {

    

    console.log(`Fetching dependencies for ${packageName}@${version}...`);
    
    // Checking for redirection
    if(String(version).startsWith('npm:')){
        options.verbose && console.log(`Package redirected to ${pkgString}`);
        let pack = extractVersion(version.split(':')[1]);
        packageName = pack.name;
        version = pack.ver;
    }

    try {
        options.verbose && console.log(`\t Fetching metadata for ${packageName}...`);
        const packageData = await fetchPackageMetadata(packageName);
        // console.log(packageData);

        options.verbose && console.log(`\t Resolving version for "${version}"...`);
        version = resolveDistTags(version, packageData.distTags);
        const resolvedVersion = maxSatisfying(Object.keys(packageData.versions), version);
        options.verbose && console.log(`\t Version "${version}" resolved to ${resolvedVersion}...`);

        const tarballUrl = packageData.versions[resolvedVersion].dist.tarball;
        const dependencies = packageData.versions[resolvedVersion].dependencies || {};
        // const devDependencies = packageData.versions[resolvedVersion].devDependencies || {};
        const peerDependencies = packageData.versions[resolvedVersion].peerDependencies || {};
        const optionalDependencies = packageData.versions[resolvedVersion].optionalDependencies || {};
        const combinedDependencies = {...dependencies, ...peerDependencies, ...optionalDependencies};
        const fullPackageName = `${packageName}@${resolvedVersion}`;

        // Checks if package is already in download list or not 
        if(!downloadList.has(fullPackageName)){
            downloadList.set( fullPackageName , tarballUrl);
            for (const [dep, depVersion] of Object.entries(combinedDependencies)) {
                await fetchDependenciesTree(dep, depVersion);
            }
        }

    } catch (error) {
        console.error(`Error fetching ${packageName}@${version}: ${error.message}`);
    }

}

/**
 * Download tarballs from the download list.
 */
async function downloadPackages(packName, version) {

    
    const size = downloadList.size;
    const downloadDir = `.\\${simplifyPackageName(packName)}-${version}-tars`;
    let i = 1;
    let downloadPromises = [];

    // Checks and creates downloadDir
    (size > 0 && !existsSync(downloadDir)) && mkdirSync(downloadDir, { recursive: true });;

    
    console.log(`Total Packages to download : ${size}`);

    for (const [pack, url] of downloadList.entries()) {
        const promise = new Promise((resolve, reject) => {

            console.log(`Download started for ${pack}...`);
            
            // const filename = basename(url);
            const packData = extractVersion(pack)
            const filename = `${simplifyPackageName(packData.name)}-${packData.ver}.tgz`;
            const filePath = join(downloadDir, filename);
            const file = createWriteStream(filePath);

            get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${filename} [${i++} of ${size}]`);
                    resolve();
                });
            }).on('error', (error) => {
                unlink(filePath, () => {}); // Remove partial file
                console.error(`Error downloading ${pack} at ${url}: ${error.message}`);
                reject(error);
            });
        });
        downloadPromises.push(promise);
    }

    (downloadPromises.length>0) && Promise.allSettled(downloadPromises).then(()=>{
        console.log(`Download Directory : ${downloadDir}`);
        console.log(`Copy this folder to offline machine and use "publish-tars" command for publishing to registry.`);
        timeAfterDownloading = performance.now();
        displayTime();
    });

}

// async function downloadPackages(packName, version = 'latest') {
//     let size = downloadList.size;
//     let i = 1;
//     let downloadDir;

//     if (size > 0) {
//         downloadDir = `.\\${simplifyPackageName(packName)}_v${version}_tars`;
//         if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
//     }

//     console.log(`Total Packages to download : ${size}`);

//     const multibar = new cliProgress.MultiBar({
//         clearOnComplete: false,
//         hideCursor: true,
//         format: '{bar} | {percentage}% | {package} | {value}/{total} bytes'
//     }, cliProgress.Presets.legacy);

//     for (const [pack, url] of downloadList.entries()) {
//         const packData = extractVersion(pack);
//         const filename = `${simplifyPackageName(packData.name)}-${packData.ver}.tgz`;
//         const filePath = join(downloadDir, filename);

//         // console.log(`Downloading ${pack} [${i} of ${size}]...`);

//         new Promise((resolve, reject) => {
//             get(url, (response) => {
//                 const total = parseInt(response.headers['content-length'] || '0', 10);
//                 const bar = multibar.create(total, 0, { package: `${pack} [${i} of ${size}]` });

//                 const file = createWriteStream(filePath);
//                 let downloaded = 0;

//                 response.on('data', (chunk) => {
//                     downloaded += chunk.length;
//                     bar.update(downloaded);
//                 });

//                 response.pipe(file);

//                 file.on('finish', () => {
//                     file.close(() => {
//                         bar.update(total);
//                         // console.log(`Downloaded: ${filename}`);
//                         resolve();
//                     });
//                 });

//                 response.on('error', (err) => {
//                     bar.stop();
//                     unlink(filePath, () => {});
//                     console.error(`Error downloading ${pack} at ${url}: ${err.message}`);
//                     reject(err);
//                 });
//             }).on('error', (error) => {
//                 unlink(filePath, () => {});
//                 console.error(`Error downloading ${pack} at ${url}: ${error.message}`);
//                 reject(error);
//             });
//         });

//         i++;
//     }

//     multibar.stop();
//     console.log('All downloads complete.');
// }

/**
 * Displays details about time taken for execution of command.
 */
function displayTime() {
    console.log(`Total time to fetch dependency tree is ${prettyMs(timeAfterFetching - timeAtStart)}`);
    console.log(`Total time to download dependencies is ${prettyMs(timeAfterDownloading - timeAfterFetching)}`);
    console.log(`Total time taken is ${prettyMs(timeAfterDownloading - timeAtStart)}`);
}


export async function packTars(packageName, version = 'latest', commandOptions) {

    options = commandOptions;
    timeAtStart = performance.now();
    await fetchDependenciesTree(packageName, version, options);
    timeAfterFetching = performance.now();
    downloadPackages(packageName, version);

}
