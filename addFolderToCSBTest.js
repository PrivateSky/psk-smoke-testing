require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");

const double_check = require("../../modules/double-check");
const assert = double_check.assert;
const brickStorageStrategyName = "http";
const edfsModule = require("edfs");
let folderPath;
let filePath;

let folders;
let files;

let PORT = 9094;
const tempFolder = "../../tmp";

const VirtualMQ = require("virtualmq");

const text = ["asta e un text", "asta e un alt text", "ana are mere"];

$$.flows.describe("AddFolderToCSB", {
    start: function (callback) {
        this.callback = callback;
        $$.securityContext = require("psk-security-context").createSecurityContext();
        this.edfs = edfsModule.attach(brickStorageStrategyName);
        $$.brickTransportStrategiesRegistry.add(brickStorageStrategyName, edfsModule.createHTTPBrickTransportStrategy("http://127.0.0.1:9094"));

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            this.createServer((err, server, url) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.server = server;
                this.url = url;
                this.createCSB();
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

    createCSB: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");

            this.edfs.createCSB((err, rawCSB) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create CSB.");

                this.rawCSB = rawCSB;
                this.addFolder();
            });
        });
    },

    addFolder: function () {
        this.rawCSB.addFolder(folderPath, folderPath, (err, mapDigest) => {
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
            this.loadCSBFromEDFS();
        });
    },

    loadCSBFromEDFS: function () {
        this.edfs.loadCSB(this.rawCSB.getSeed(), (err, newRawCSB) => {
            assert.true(err === null || typeof err === "undefined", "Failed to load CSB.");

            this.listFiles(newRawCSB);
        });
    },

    listFiles: function (rawCSB) {
        rawCSB.listFiles(folderPath, (err, CSBFiles) => {
            assert.true(err === null || typeof err === "undefined", "Failed to list files.");
            assert.arraysMatch(files, CSBFiles, "Unexpected file list");

            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));

    assert.callback("Add folder to CSB test", (callback) => {
        $$.flows.start("AddFolderToCSB", "start", callback);
    }, 2000);
});