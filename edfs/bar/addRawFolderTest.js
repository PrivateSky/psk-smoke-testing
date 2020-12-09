require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");
const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("AddRawFolder", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.createBAR();
            });
        });

    },

    createBAR: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, bar) => {
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

                        this.bar.getKeySSI((err, seedSSI) => {
                            if (err) {
                                throw err;
                            }
                            resolver.loadDSU(seedSSI, (err, newBar) => {
                                if (err) {
                                    throw err;
                                }

                                newBar.listFolders("/", (err, folders) => {
                                    if (err) {
                                        throw err;
                                    }
                                    assert.true(folders.length === 1);
                                    this.callback();
                                });
                            });
                        });
                    });
                });
            });
        })
    },

    addFolder: function (fsFolderPath, barPath, callback) {
        this.bar.addFolder(fsFolderPath, barPath, {encrypt: false}, callback);
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
