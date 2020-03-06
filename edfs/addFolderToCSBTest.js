require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const assert = double_check.assert;
const brickStorageStrategyName = "justAnAlias";
const edfsModule = require("edfs");
const tir = require("../../../psknode/tests/util/tir");

let folderPath;

let files;

const text = ["asta e un text", "asta e un alt text", "ana are mere"];

$$.flows.describe("AddFolderToCSB", {
    start: function (callback) {
        this.callback = callback;
        $$.securityContext = require("psk-security-context").createSecurityContext();
        this.edfs = edfsModule.attach(brickStorageStrategyName);

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                $$.brickTransportStrategiesRegistry.add(brickStorageStrategyName, new edfsModule.HTTPBrickTransportStrategy(`http://localhost:${port}`));
                this.createCSB();
            });
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