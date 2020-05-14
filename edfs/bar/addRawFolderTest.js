require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const assert = double_check.assert;
const EDFS = require("edfs");

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");

const text = ["first", "second", "third"];

$$.flows.describe("AddRawFolder", {
    start: function (callback) {
        this.callback = callback;
        $$.securityContext = require("psk-security-context").createSecurityContext();

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.port = port;
                const endpoint = `http://localhost:${port}`;
                this.edfs = EDFS.attachToEndpoint(endpoint);
                this.createBAR();
            });
        });

    },

    createBAR: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");
            this.edfs.createBar((err, bar) => {
                if (err) {
                    throw err;
                }

                this.bar = bar;
                this.addFolder(folderPath, "fld1", (err, initialHash) => {
                    if (err) {
                        throw err;
                    }

                    this.bar.delete("/", (err) => {
                        if (err) {
                            throw err;
                        }


                        this.addFolder(folderPath, "fld2", (err, controlHash) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(initialHash === controlHash);
                            this.callback();
                        });
                    });
                });
            })
        });
    },

    addFolder: function (fsFolderPath, barPath, callback) {
        this.bar.addFolder(fsFolderPath, barPath, {encrypt: false}, (err, mapDigest) => {
            if (err) {
                return callback(err);
            }

            this.bar.getFolderHash(barPath, callback)
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add raw folder to bar test", (callback) => {
        $$.flows.start("AddRawFolder", "start", callback);
    }, 3000);
});
