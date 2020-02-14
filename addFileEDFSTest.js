require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");

const bar = require('bar');
const createEDFSBrickStorage = require("edfs-brick-storage").createEDFSBrickStorage;
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const double_check = require("../../modules/double-check");
const assert = double_check.assert;
const Archive = bar.Archive;
const ArchiveConfigurator = bar.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
const path = require("path");

let folderPath;
let filePath;
let barPath;

let folders;

let PORT = 9191;
let tempFolder;

const VirtualMQ = require("virtualmq");

const text = ["asta e un text", "asta e un alt text", "ana are mere"];

$$.flows.describe("AddFile", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist(folders, filePath, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFileHash(filePath, (err, initialHash) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");

                this.initialHash = initialHash;
                this.createServer((err, server, url) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.server = server;
                    this.url = url;
                    this.createArchive();
                });
            });
        });

    },

    createServer: function (callback) {
        let server = VirtualMQ.createVirtualMQ(PORT, tempFolder, undefined, (err, res) => {
            if (err) {
                console.log("Failed to create VirtualMQ server on port ", PORT);
                console.log("Trying again...");
                if (PORT > 0 && PORT < 50000) {
                    PORT++;
                    this.createServer(callback);
                } else {
                    throw err;
                }
            } else {
                console.log("Server ready and available on port ", PORT);
                let url = `http://127.0.0.1:${PORT}`;
                callback(undefined, server, url);
            }
        });
    },

    createArchive: function () {
        this.archiveConfigurator = new ArchiveConfigurator();
        this.archiveConfigurator.setStorageProvider("EDFSBrickStorage", this.url);
        this.archiveConfigurator.setFsAdapter("FsAdapter");
        this.archiveConfigurator.setBufferSize(256);
        this.archive = new Archive(this.archiveConfigurator);

        this.addFile();
    },

    addFile: function () {
        this.archive.addFile(filePath, barPath, (err, mapDigest) => {
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");

            double_check.deleteFoldersSync(folderPath);
            this.extractFile();
        });
    },

    extractFile: function () {
        const archive = new Archive(this.archiveConfigurator);
        archive.extractFile(filePath, barPath, (err) => {
            assert.true(err === null || typeof err === "undefined", `Failed to extract file ${filePath}`);

            double_check.computeFileHash(filePath, (err, newHash) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                assert.true(this.initialHash === newHash, "The extracted file is not te same as the initial one");

                double_check.deleteFoldersSync([folderPath]);

                this.server.close((err) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to close server.");

                    this.callback();
                });
            });
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    tempFolder = path.join(testFolder, "tmp");
    folderPath = path.join(testFolder, "fld");
    barPath = "myFile";
    folders = [folderPath];
    filePath = path.join(testFolder, "fld", "a.txt");
    assert.callback("AddFileEDFSTest", (callback) => {
        $$.flows.start("AddFile", "start", callback);
    }, 1000);
});