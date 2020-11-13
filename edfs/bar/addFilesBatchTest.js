require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const keySSISpace = openDSU.loadApi("keyssi");
const bdns = openDSU.loadApi("bdns");
const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("AddFilesBatch", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                bdns.addRawInfo("default", {
                    brickStorages: [`http://localhost:${port}`],
                    anchoringServices: [`http://localhost:${port}`]
                });

                this.createBAR();
            });
        });

    },

    createBAR: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");
            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, bar) => {
                if (err) {
                    throw err;
                }

                this.bar = bar;
                this.bar.addFiles(files, 'filesFolder', {batch: true}, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    this.runAssertions();
                })
            })
        });
    },
    runAssertions: function () {
        this.bar.listFiles('filesFolder', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.length === 3);
            assert.true(files.indexOf('a.txt') !== -1);
            assert.true(files.indexOf('b.txt') !== -1);
            assert.true(files.indexOf('c.txt') !== -1);

            this.bar.readFile('/filesFolder/a.txt', (err, data) => {
                assert.true(err === null || typeof err === "undefined", "Failed to read file");
                assert.true(text[0] === data.toString(), "Invalid read first file");

                this.bar.readFile('/filesFolder/b.txt', (err, data) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to read file");
                    assert.true(text[1] === data.toString(), "Invalid read second file");

                    this.bar.readFile('/filesFolder/c.txt', (err, data) => {
                        assert.true(err === null || typeof err === "undefined", "Failed to read file");
                        assert.true(text[2] === data.toString(), "Invalid read third file");
                        this.callback();
                    })
                })
            })
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("Add files (batch: true) to bar test", (callback) => {
        $$.flows.start("AddFilesBatch", "start", callback);
    }, 3000);
});
