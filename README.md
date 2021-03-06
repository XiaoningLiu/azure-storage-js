# Azure Storage JavaScript Client Library for Blob Service

## Introduction

This project provides a client library in JavaScript that makes it easy to consume Microsoft Azure Storage services.

Please note that this version of the library is a compete overhaul of the current Azure Storage Node.js Client Library, and is based on the new Storage SDK architecture, also referred to as V10.

### Features

- Blob
  - Create/Read/Update/Delete containers
  - Create/Read/Update/Delete blobs
- Features new to V10
  - Asynchronous I/O for all operations using the async methods
  - HttpPipeline which enables a high degree of per-request configurability
  - 1-to-1 correlation with the Storage REST API for clarity and simplicity

## Getting Started

1. Clone source code

```
git clone <repo>
```

2. npm install

```
npm install
```

3. Build

```
tsc
```

4. Try with samples

```
node dist/samples/*.js
```

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit <https://cla.microsoft.com.>

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
