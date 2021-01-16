require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");
const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("AddFolderBatch", {
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
            this.addFolder(folderPath, "fld1",  (err, initialHash) => {
                if (err) {
                    throw err;
                }

                this.bar.getKeySSIAsString((err, seedSSI) => {
                    resolver.loadDSU(seedSSI, (err, dsu) => {
                        dsu.listFiles('/', (err, files) => {
                            assert.true(files.length === 4);

                            dsu.readFile('/fld1/a.txt', (err, data) => {
                                assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                assert.true(text[0] === data.toString(), "Invalid read first file");

                                dsu.readFile('/fld1/b.txt', (err, data) => {
                                    assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                    assert.true(text[1] === data.toString(), "Invalid read second file");

                                    dsu.readFile('/fld1/c.txt', (err, data) => {
                                        assert.true(err === null || typeof err === "undefined", "Failed to read file");
                                        assert.true(text[2] === data.toString(), "Invalid read third file");

                                        this.callback();
                                    });
                                });
                            });
                        })
                    })
                })
            });
        })
    },

    addFolder: function (fsFolderPath, barPath, callback) {
        this.bar.addFolder(fsFolderPath, barPath, {batch: true}, callback);
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add folder (batch: true) to bar test", (callback) => {
        $$.flows.start("AddFolderBatch", "start", callback);
    }, 3000);
});
