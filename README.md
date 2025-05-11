# Offline Registry Manager

A simple CLI tool to manage offline npm registries such as [Verdaccio](https://verdaccio.org/). This tool helps package and publish npm modules efficiently in environments where internet access is limited or unavailable.

## 📦 Features

- Package npm modules into tarballs
- Publish packages to a local registry
- Optimized for offline development environments
- Command-line interface for easy automation

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v14 or later
- A local npm registry (e.g., [Verdaccio](https://verdaccio.org/))

### Installation

Install globally using npm:

```bash
npm install -g offline-registry-manager
```

### Usage

```bash
pack-pub [options]
```

#### Options

| Option      | Description                       |
|-------------|-----------------------------------|
| --help      | Display help for the command      |
| --version   | Display the version of the tool   |

⚠️ More detailed usage instructions will be added in future versions.

## 📦 Dependencies

- [commander](https://www.npmjs.com/package/commander) – CLI argument parser
- [semver](https://www.npmjs.com/package/semver) – Semantic versioning utilities
- [pretty-ms](https://www.npmjs.com/package/pretty-ms) – Format milliseconds to human-readable strings

## 📜 License

This project is licensed under the MIT License.

## 👤 Author

Rishabh Dogra
[GitHub Profile](https://github.com/Rd-Rishabh)

## 📂 Repository

[GitHub - Rd-Rishabh/node-offline-registry-manager](https://github.com/Rd-Rishabh/node-offline-registry-manager)