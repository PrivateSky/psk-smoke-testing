require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const assert = double_check.assert;
const edfsModule = require("edfs");
const tir = require("../../../psknode/tests/util/tir");

let folderPath;

let files;

const text = ["asta e un text", "asta e un alt text", "ana are mere"];

$$.flows.describe("AddFolderToCSB", {
    start: function (callback) {
        this.callback = callback;
        $$.securityContext = require("psk-security-context").createSecurityContext();

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");
                const endpoint = `http://localhost:${port}`;
                this.edfs = edfsModule.attachToEndpoint(endpoint);
                this.createCSB();
            });
        });

    },

    createCSB: function () {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");

            this.rawDossier = this.edfs.createCSB();
            this.addFolder();
        });
    },

    addFolder: function () {
        this.rawDossier.addFolder(folderPath, folderPath, (err, mapDigest) => {
            if (err) {
                throw err;
            }
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
            this.loadCSBFromEDFS();
        });
    },

    loadCSBFromEDFS: function () {
        const newRawCSB = this.edfs.loadBar(this.rawDossier.getSeed());
        this.listFiles(newRawCSB);
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
    }, 3000
    );
});