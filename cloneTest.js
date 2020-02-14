require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");
require("callflow");

const double_check = require("double-check");
const assert = double_check.assert;
const EDFS = require("edfs");
const brickTransportStrategyName = EDFS.HTTPBrickTransportStrategy.prototype.HTTP_BRICK_TRANSPORT_STRATEGY;

const fs = require("fs");
const path = require("path");

let folderPath;
let filePath;
let savePath;
let cloneStoragePath;


let folders;
let files;

let PORT = 9192;
const tempFolder = "../../tmp";

const VirtualMQ = require("virtualmq");

const text = ["asta e un text", "asta e un alt text", "ana are mere"];

$$.flows.describe("BarClone", {
    start: function (callback) {
        this.callback = callback;

        this.edfsBrickStorage = require("edfs-brick-storage").create(brickTransportStrategyName);
        double_check.ensureFilesExist(folders, files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFoldersHashes(folderPath, (err, initialHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");

                this.initialHashes = initialHashes;
                this.createServer((err, server, url) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.server = server;
                    this.url = url;
                    $$.brickTransportStrategiesRegistry.add(brickTransportStrategyName, new EDFS.HTTPBrickTransportStrategy(url));
                    this.edfsBrickStorage = require("edfs-brick-storage").create(brickTransportStrategyName);
                    this.edfs = EDFS.attach(brickTransportStrategyName);
                    this.archive  = this.edfs.createBar();
                    this.addFolder();
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

    addFolder: function () {
        this.archive.addFolder(folderPath, (err, mapDigest) => {
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
            this.cloneBar();
        });
    },

    cloneBar: function () {
        this.archive.clone(this.edfsBrickStorage, true, (err, newSeed) => {
            assert.true(err === null || typeof err === "undefined", `Failed to delete file ${filePath}`);
            assert.true(newSeed !== null && typeof newSeed !== "undefined", "SEED is null or undefined");
            assert.false(newSeed.toString() === this.archive.getSeed().toString());
            this.extractFolder(newSeed);
        });
    },

    extractFolder: function (seed) {
        const archive = this.edfs.loadBar(seed);

        archive.extractFolder(folderPath, err => {
            assert.true(err === null || typeof err === "undefined", `Failed to extract folder ${folderPath}`);
            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

    folderPath = path.join(testFolder, "fld");
    savePath = path.join(testFolder, "dot");
    cloneStoragePath = path.join(testFolder, "aux");

    folders = [folderPath, cloneStoragePath];
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));

    assert.callback("Bar clone test", (callback) => {
        $$.flows.start("BarClone", "start", callback);
    }, 2000);
});