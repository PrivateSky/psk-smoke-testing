require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const bar = require('bar');
const createEDFSBrickStorage = require("edfs-brick-storage").create;
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const double_check = require("double-check");
const assert = double_check.assert;
const Archive = bar.Archive;
const ArchiveConfigurator = bar.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
const path = require("path");

const tir = require("../../../../psknode/tests/util/tir.js");

let folderPath;
let filePath;
let barPath;

let folders;

let tempFolder;

const text = ["first text", "second fragment", "third"];

$$.flows.describe("AddFile", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist(folders, filePath, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFileHash(filePath, (err, initialHash) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");

                this.initialHash = initialHash;
                tir.launchVirtualMQNode((err, port) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.port = port;
                    this.createArchive();
                });
            });
        });

    },

    createArchive: function () {
        const EDFS = require('edfs');
        const endpoint = `http://localhost:${this.port}`;
        this.edfs = EDFS.attachToEndpoint(endpoint);
        this.archive = this.edfs.createBar();

        this.addFile();
    },

    addFile: function () {
        this.archive.addFile(filePath, barPath, (err, mapDigest) => {
            if(err){
                throw err;
            }
            let fs = require("fs");
            //double_check.deleteFoldersSync(folderPath);
            fs.rmdirSync(folderPath, {recursive: true, maxRetries: 10});
            this.extractFile(this.archive.getSeed());
        });
    },

    extractFile: function (seed) {
        const archive = this.edfs.loadBar(seed);
        archive.extractFile(filePath, barPath, (err) => {
            if(err){
                throw err;
            }

            double_check.computeFileHash(filePath, (err, newHash) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                assert.true(this.initialHash === newHash, "The extracted file is not te same as the initial one");

                double_check.deleteFoldersSync([folderPath]);

                this.callback();
            });
        });
    }
});

double_check.createTestFolder("Extract file from bar", (err, testFolder) => {
    tempFolder = path.join(testFolder, "tmp");
    folderPath = path.join(testFolder, "fld");
    barPath = "myFile";
    folders = [folderPath];
    filePath = path.join(testFolder, "fld", "a.txt");
    assert.callback("AddFileEDFSTest", (callback) => {
        $$.flows.start("AddFile", "start", callback);
    }, 3000);
});