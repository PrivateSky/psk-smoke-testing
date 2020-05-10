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

$$.flows.describe("CloneBarTest", {
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
            this.bar = this.edfs.createBar();
            this.bar.load((err) => {
                if (err) {
                    throw err;
                }

                this.addFolder(folderPath, "fld1", (err, initialHash) => {
                    if (err) {
                        throw err;
                    }

                    this.cloneBar();
                });
            })
        });
    },

    addFolder: function (fsFolderPath, barPath, callback) {
        this.bar.addFolder(fsFolderPath, barPath, (err, mapDigest) => {
            if (err) {
                return callback(err);
            }

            this.bar.getFolderHash(barPath, callback)
        });
    },

    cloneBar: function () {
        this.edfs.clone(this.bar.getSeed(), (err, seed) => {
            if (err) {
                throw err;
            }

            assert.true(typeof err === 'undefined');
            assert.true(this.bar.getSeed() !== seed);

            this.runAssertions(seed);
        });
    },

    runAssertions: function (seed) {
        this.edfs.loadBar(seed, (err, bar) => {
            if (err) {
                throw err;
            }

            bar.listFiles('/', (err, files) => {
                if (err) {
                    throw err;
                }

                assert.true(files.length === 3);
                assert.true(files.indexOf('/fld1/a.txt') !== -1);
                assert.true(files.indexOf('/fld1/b.txt') !== -1);
                assert.true(files.indexOf('/fld1/c.txt') !== -1);

                bar.readFile('/fld1/a.txt', (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(data.toString() === 'first');

                    bar.readFile('/fld1/b.txt', (err, data) => {
                        if (err) {
                            throw err;
                        }

                        assert.true(data.toString() === 'second');

                        bar.readFile('/fld1/c.txt', (err, data) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(data.toString() === 'third');
                            this.callback();
                        });
                    });
                });
            })
        })

    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add raw folder to bar test", (callback) => {
        $$.flows.start("CloneBarTest", "start", callback);
    }, 3000);
});
