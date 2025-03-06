// const pacote = require('pacote');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const { console } = require('inspector');

// const downloadDir = path.join(os.homedir(), 'npm-packages');
// if (!fs.existsSync(downloadDir)) {
//     fs.mkdirSync(downloadDir, { recursive: true });
// }

// const queue = [];
// const downloaded = new Set();

// async function fetchDependencies(packageName, version = 'latest') {
//     try {
//         const manifest = await pacote.manifest(`${packageName}@${version}`);
//         const { dependencies = {} } = manifest;
//         const tarballUrl = manifest.dist.tarball;

//         if (!downloaded.has(tarballUrl)) {
//             queue.push({ name: packageName, version: manifest.version, tarballUrl });
//             downloaded.add(tarballUrl);
//         }

//         for (const [dep, depVersion] of Object.entries(dependencies)) {
//             await fetchDependencies(dep, depVersion);
//         }
//     } catch (error) {
//         console.error(`Error fetching ${packageName}@${version}:`, error.message);
//     }
// }

// async function downloadPackages() {
//     while (queue.length > 0) {
//         const { name, version, tarballUrl } = queue.shift();
//         const filename = `${name}-${version}.tgz`;
//         const filePath = path.join(downloadDir, filename);

//         if (fs.existsSync(filePath)) {
//             console.log(`Already downloaded: ${filename}`);
//             continue;
//         }

//         try {
//             console.log(`Downloading ${name}@${version}...`);
//             const tarball = await pacote.tarball.stream(`${name}@${version}`);
//             const writeStream = fs.createWriteStream(filePath);
//             tarball.pipe(writeStream);
//             await new Promise((resolve, reject) => {
//                 writeStream.on('finish', resolve);
//                 writeStream.on('error', reject);
//             });
//             console.log(`Downloaded: ${filename}`);
//         } catch (error) {
//             console.error(`Error downloading ${name}@${version}:`, error.message);
//         }
//     }
// }

// async function main() {
//     const args = process.argv.slice(2);
//     if (args.length === 0) {
//         console.error('Usage: node script.js <package-name> [version]');
//         process.exit(1);
//     }
    
//     const [packageName, version] = args;
//     console.log(`Fetching dependencies for ${packageName}@${version || 'latest'}...`);
//     await fetchDependencies(packageName, version);
//     await downloadPackages();
// }


const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const registryUrl = 'https://registry.npmjs.org/';
const downloadDir = path.join(os.homedir(), 'npm-packages');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

const queue = [];
const downloaded = new Set();

/**
 * Fetch package metadata from the npm registry.
 */
function fetchPackageMetadata(packageName, version = 'latest') {
    return new Promise((resolve, reject) => {
        https.get(`${registryUrl}${packageName}`, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const metadata = JSON.parse(data);
                    if (metadata.error) {
                        return reject(new Error(`Package not found: ${packageName}`));
                    }
                    let resolvedVersion = version;
                    if (!metadata.versions[version]) {
                        resolvedVersion = resolveVersion(version, metadata);
                    }
                    resolve(metadata.versions[resolvedVersion]);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Resolve semantic versioning manually.
 */
function resolveVersion(version, metadata) {
    if (version === 'latest') return metadata['dist-tags'].latest;
    const versions = Object.keys(metadata.versions);
    return versions.find(v => v.startsWith(version.replace('x', ''))) || versions[versions.length - 1];
}

/**
 * Recursively fetch dependencies and add to queue.
 */
async function fetchDependencies(packageName, version = 'latest') {
    console.log(`Fetching dependencies for ${packageName}@${version}...`);
    try {
        const packageData = await fetchPackageMetadata(packageName, version);
        const tarballUrl = packageData.dist.tarball;
        const dependencies = packageData.dependencies || {};

        if (!downloaded.has(tarballUrl)) {
            queue.push({ name: packageName, version: packageData.version, tarballUrl });
            downloaded.add(tarballUrl);
        }

        for (const [dep, depVersion] of Object.entries(dependencies)) {
            await fetchDependencies(dep, depVersion);
        }
    } catch (error) {
        console.error(`Error fetching ${packageName}@${version}: ${error.message}`);
    }
}

/**
 * Download tarballs from the queue.
 */
async function downloadPackages() {
    while (queue.length > 0) {
        const { name, version, tarballUrl } = queue.shift();
        const filename = `${name}-${version}.tgz`;
        const filePath = path.join(downloadDir, filename);

        if (fs.existsSync(filePath)) {
            console.log(`Already downloaded: ${filename}`);
            continue;
        }

        console.log(`Downloading ${name}@${version}...`);
        const file = fs.createWriteStream(filePath);
        https.get(tarballUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
            });
        }).on('error', (error) => {
            fs.unlink(filePath, () => {}); // Remove partial file
            console.error(`Error downloading ${name}@${version}: ${error.message}`);
        });
    }
}

/**
 * Entry point.
 */
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node script.js <package-name> [version]');
        process.exit(1);
    }

    const [packageName, version] = args;
    // console.log(`Fetching dependencies for ${packageName}@${version || 'latest'}...`);
    await fetchDependencies(packageName, version);
    await downloadPackages();
}

// main().catch(console.error);

console.time('Total Time');
console.log(234234);
main().catch(console.error);
console.timeEnd('Total Time');