import { get } from 'https';
import { existsSync, mkdirSync, createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { maxSatisfying } from 'semver';
import config from '../config.js';

const downloadList = new Map();

/**
 * Fetch package metadata from the npm registry.
 */
function fetchPackageMetadata(packageName) {
    return new Promise((resolve, reject) => {
        get(`${config.registryUrl}${packageName}`, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const metadata = JSON.parse(data);
                    if (metadata.error) {
                        return reject(new Error(`Package not found: ${packageName}`));
                    }
                    resolve({
                        "versions": metadata.versions,
                        "distTags": metadata['dist-tags'],
                    });
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch package name and version from string in following pattern <package-name>@<version>
 * Also caters scoped npm packages
 */
function extractVersion(pkgString) {
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

/**
 * Resolve dist tags for version.
 */
function resolveDistTags(version, distTags) {
    if(Object.keys(distTags).includes(version)) return distTags[version];

    return version;
}

/**
 * Resolve dist tags for version.
 */
function simplifyPackageName(packageName) {
    return String(packageName).replaceAll('@','').replaceAll('/','-') 
}

/**
 * Recursively fetch dependencies and add to download list.
 */
async function fetchDependenciesTree(packageName, version = 'latest') {

    console.log(`Fetching dependencies for ${packageName}@${version}...`);
    
    // Checking for redirection
    if(String(version).startsWith('npm:')){
        console.log(`Package redirected to ${pkgString}`);
        let pack = extractVersion(version.split(':')[1]);
        packageName = pack.name;
        version = pack.ver;
    }

    try {
        console.log(`\t Fetching metadata for ${packageName}...`);
        const packageData = await fetchPackageMetadata(packageName);
        // console.log(packageData);

        console.log(`\t Resolving version for "${version}"...`);
        version = resolveDistTags(version, packageData.distTags);
        const resolvedVersion = maxSatisfying(Object.keys(packageData.versions), version);
        console.log(`\t Version "${version}" resolved to ${resolvedVersion}...`);

        const tarballUrl = packageData.versions[resolvedVersion].dist.tarball;
        const dependencies = packageData.versions[resolvedVersion].dependencies || {};

        const fullPackageName = `${packageName}@${resolvedVersion}`;

        // Checks if package is already in download list or not 
        if(!downloadList.has(fullPackageName)){
            downloadList.set( fullPackageName , tarballUrl);
            for (const [dep, depVersion] of Object.entries(dependencies)) {
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
async function downloadPackages(packName, version = 'latest') {

    const downloadDir = `.\\${simplifyPackageName(packName)}_v${version}_with_dependencies`;
    if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });

    let size = downloadList.size;
    let i = 1;

    console.log(`Total Packages to download : ${size}`);

    for (const [pack, url] of downloadList.entries()) {
        console.log(`Downloading ${pack} [${i} of ${size}]...`);
        // const filename = basename(url);
        const packData = extractVersion(pack)
        const filename = `${simplifyPackageName(packData.name)}-${packData.ver}.tgz`;
        const filePath = join(downloadDir, filename);
        const file = createWriteStream(filePath);
        get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
            });
        }).on('error', (error) => {
            unlink(filePath, () => {}); // Remove partial file
            console.error(`Error downloading ${pack} at ${url}: ${error.message}`);
        });
        
        i += 1;
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

    console.time('Time to fetch dependencies');
    await fetchDependenciesTree(packageName, version);
    console.timeEnd('Time to fetch dependencies');
    
    await downloadPackages(packageName, version);
}

// main().catch(console.error);

await main().catch(console.error);

