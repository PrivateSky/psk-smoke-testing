require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const assert = double_check.assert;
const EDFS = require("edfs");
const brickTransportStrategyName = EDFS.HTTPBrickTransportStrategy.prototype.HTTP_BRICK_TRANSPORT_STRATEGY;

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
        this.edfs = EDFS.attach(brickTransportStrategyName);


        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            this.createServer((err, server, url) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.server = server;
                this.url = url;
                $$.brickTransportStrategiesRegistry.add(brickTransportStrategyName, new EDFS.HTTPBrickTransportStrategy(url));
                this.createBAR();
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

    createBAR: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");
            this.bar = this.edfs.createBar();
            this.addFolder();
        });
    },

    addFolder: function () {
        this.bar.addFolder(folderPath, "fld", (err, mapDigest) => {
            if (err) {
                throw err;
            }
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
            this.extractFile();
        });
    },

    extractFile: function () {
        this.bar.extractFile(filePath, "fld/a.txt", (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to extract file.");
            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add folder to CSB test", (callback) => {
        $$.flows.start("AddFolderToCSB", "start", callback);
    }, 2000);
});