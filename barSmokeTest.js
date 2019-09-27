require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/psknode");
require("callflow");
const bar = require('bar');
const double_check = require("../../modules/double-check");
const assert = double_check.assert;
const Archive = bar.Archive;
const ArchiveConfigurator = bar.ArchiveConfigurator;
const fs = require("fs");
const crypto = require("crypto");

const folderPath = "fld";
const filePath = "fld/a.txt";
let savePath = "dot";


const folders = ["fld"];
const files = [
    "fld/a.txt", "fld/b.txt", "fld/c.txt"
];

const text = ["asta e un text?", "ana are mere", "hahahaha"];


$$.flows.describe("barTest", {
    start: function (callback) {
        this.callback = callback;
        this.archiveConfigurator = new ArchiveConfigurator();
        this.archiveConfigurator.setStorageProvider("FileBrickStorage", savePath);
        this.archiveConfigurator.setFsAdapter("FsAdapter");
        this.archiveConfigurator.setBufferSize(2);
        this.archiveConfigurator.setMapEncryptionKey(crypto.randomBytes(32));
        this.archive = new Archive(this.archiveConfigurator);

        double_check.ensureFilesExist(folders, files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");
            this.addFolder();
        });
    },

    addFolder: function () {
        this.archive.addFolder(folderPath, (err, mapDigest) => {
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");

            double_check.deleteFoldersSync(folderPath);
            this.deleteFile();
        });
    },

    deleteFile: function () {
        this.archive.deleteFile(filePath, (err) => {
            if (err) {
                throw err;
            }
            assert.true(err === null || typeof err === "undefined", `Failed to delete file ${filePath}`);
            this.createNewHierarchy();
        });
    },

    createNewHierarchy: function () {
        double_check.ensureFilesExist(folders, files.slice(1), text.slice(1), (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFoldersHashes(folderPath, (err, initialHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                this.extractFolder(initialHashes);
            });
        });
    },

    extractFolder: function (initialHashes) {
        this.initialHashes = initialHashes;
        this.archive.extractFolder(savePath, (err) => {
            assert.true(err === null || typeof err === "undefined", `Failed to extract folder from file ${savePath}`);

            double_check.computeFoldersHashes(folderPath, (err, newHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                assert.hashesAreEqual(initialHashes, newHashes, "The extracted files are not te same as the initial ones");

                double_check.deleteFoldersSync(folderPath);
                this.createNewArchive();
            });
        });
    },

    createNewArchive: function () {
        const archive = new Archive(this.archiveConfigurator);
        archive.extractFolder(savePath, (err) => {
            assert.true(err === null || typeof err === "undefined", `Failed to extract folder from file ${savePath}`);

            double_check.computeFoldersHashes(folderPath, (err, newHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                assert.hashesAreEqual(this.initialHashes, newHashes, "The extracted files are not te same as the initial ones");

                double_check.deleteFoldersSync(folderPath);
                fs.unlinkSync(savePath);
                this.callback();
            });
        });
    }
});


assert.callback("Bar smoke test", (callback) => {
$$.flows.start("barTest", "start", callback);
}, 3000);