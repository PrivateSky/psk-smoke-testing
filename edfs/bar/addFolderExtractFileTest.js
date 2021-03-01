require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");

const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("AddFolderToCSB", {
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
        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
            if (err) {
                throw err;
            }

            this.bar = bar;
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
    }, 3000);
});
