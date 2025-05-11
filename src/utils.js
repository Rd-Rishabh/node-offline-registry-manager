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
 * Simplifies package name for naming of tarballs.
 */
function simplifyPackageName(packageName) {
    return String(packageName).replaceAll('@','').replaceAll('/','-') 
}

export {extractVersion, simplifyPackageName};