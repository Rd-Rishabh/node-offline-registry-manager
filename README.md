# Offline Registry Manager (pack-pub)

A CLI tool for **packing, downloading, publishing, and installing npm packages with all dependencies**, mainly for **offline environments** and **offline registries like Verdaccio**.


## 📦 Features

* Download npm package tarballs along with all dependencies
* Publish tarballs to an offline npm registry
* Prepare packages for **completely offline installation**
* Install packages offline without accessing any registry
* Special helper command to download **Verdaccio** for offline use
* Verbose logging support for all commands


## 🚀 Getting Started

### Prerequisites

* **Node.js v14+**
* **npm**
* A local registry like [Verdaccio](https://verdaccio.org/)


## 📥 Installation

Install globally using npm:

```bash
npm install -g pack-pub
```

This will expose the CLI command:

```bash
pack-pub
```

## 🧰 CLI Usage

```bash
pack-pub <command> [options]
```

Run help anytime:

```bash
pack-pub --help
```

## 📌 Commands


### 🔹 `pack-tars`

Download npm tarballs for a package and all its dependencies.

```bash
pack-pub pack-tars <packageName> [version]
```

**Options:**

* `-v, --verbose` — detailed output

**Example:**

```bash
pack-pub pack-tars express 4.18.2
```

---

### 🔹 `publish-tars`

Publish previously downloaded tarballs to an offline registry.

```bash
pack-pub publish-tars <directory>
```

**Options:**

* `-v, --verbose` — detailed output

**Example:**

```bash
pack-pub publish-tars ./tarballs
```

---

### 🔹 `pack-offline`

Prepare a package and all dependencies for **offline installation**, without requiring a registry.

```bash
pack-pub pack-offline <packageName> [version]
```

**Options:**

* `-v, --verbose` — detailed output

**Example:**

```bash
pack-pub pack-offline lodash
```

---

### 🔹 `install-offline`

Install a package from a directory created using `pack-offline` or `download-verdaccio`.

```bash
pack-pub install-offline <directory>
```

**Options:**

* `-g, --global` — install globally
* `-v, --verbose` — detailed output

**Example:**

```bash
pack-pub install-offline ./offline-package
```

---

### 🔹 `download-verdaccio`

Download **Verdaccio** and all its dependencies for offline usage.
Internally uses `pack-offline`.

```bash
pack-pub download-verdaccio [version]
```

**Options:**

* `-v, --verbose` — detailed output

**Example:**

```bash
pack-pub download-verdaccio
```

## 🧭 Usage Diagram

### 🔁 Overall Workflow

```
┌─────────────────┐
│  Online System  │
│ (with internet) │
└────────┬────────┘
         │
         │ pack-tars / pack-offline
         ▼
┌────────────────────────────┐
│  Downloaded npm tarballs   │
│  (with dependencies)       │
└────────┬───────────────────┘
         │
         │ publish-tars
         ▼
┌────────────────────────────┐
│ Offline npm Registry       │
│ (e.g. Verdaccio)           │
└────────┬───────────────────┘
         │
         │ npm install
         ▼
┌────────────────────────────┐
│  Offline Development Env   │
└────────────────────────────┘
```

### 📦 Offline-Only (No Registry) Flow

```
┌─────────────────┐
│  Online System  │
└────────┬────────┘
         │
         │ pack-offline
         ▼
┌────────────────────────────┐
│ Offline Package Directory  │
│ (tarballs + metadata)      │
└────────┬───────────────────┘
         │
         │ install-offline
         ▼
┌────────────────────────────┐
│  Offline Machine / CI      │
│  (No internet required)    │
└────────────────────────────┘
```

### 🧪 Verdaccio Offline Setup Flow

```
`pack-pub download-verdaccio`
         │
         ▼
┌────────────────────────────┐
│ Verdaccio Offline Bundle   │
│ (server + dependencies)    │
└────────┬───────────────────┘
         │
         │ install-offline
         ▼
┌────────────────────────────┐
│ Offline Verdaccio Server   │
└────────────────────────────┘
```


## 📦 Dependencies

- [commander](https://www.npmjs.com/package/commander) – CLI argument parser
- [semver](https://www.npmjs.com/package/semver) – Semantic versioning utilities
- [pretty-ms](https://www.npmjs.com/package/pretty-ms) – Format milliseconds to human-readable strings


## 📜 License

This project is licensed under the MIT License.


## 👤 Author

**Rishabh Dogra**
[GitHub Profile](https://github.com/Rd-Rishabh)


## 📂 Repository

[GitHub - Rd-Rishabh/node-offline-registry-manager](https://github.com/Rd-Rishabh/node-offline-registry-manager)

