require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/psknode");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");

const VirtualMQ = require("virtualmq");
const bar = require('bar');

const createEDFSBrickStorage = require("edfs-brick-storage").createEDFSBrickStorage;
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const double_check = require("../../modules/double-check");
const assert = double_check.assert;
const Archive = bar.Archive;
const ArchiveConfigurator = bar.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
const path = require("path");

let folderPath;
let filePath;
let savePath;


let folders;
let files;
const text = ["asta e un text?", "ana are mere", "hahahaha"];

let PORT = 9091;
const tempFolder = "../../tmp";

$$.flows.describe("barTest", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist(folders, files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            double_check.computeFoldersHashes(folderPath, (err, initialHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");

                this.initialHashes = initialHashes;
                this.createServer((err, server, url) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                    this.server = server;
                    this.url = url;
                    this.addFolder();
                });
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

    createArchiveConfigurator: function () {
        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", this.url);
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setBufferSize(2);
        return archiveConfigurator;
    },

    addFolder: function () {
        const archive = new Archive(this.createArchiveConfigurator());
        archive.addFolder(folderPath, (err, mapDigest) => {
            assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
            assert.true(mapDigest !== null && typeof mapDigest !== "undefined", "Failed to add folder.");
            double_check.deleteFoldersSync(folderPath);
            this.extractFolder(mapDigest);
        });
    },


    extractFolder: function (mapDigest) {
        const archiveConfig = this.createArchiveConfigurator();
        archiveConfig.setMapDigest(mapDigest);
        const archive = new Archive(archiveConfig);
        archive.extractFolder(folderPath, folderPath,(err) => {
            assert.true(err === null || typeof err === "undefined", `Failed to extract folder from file ${savePath}`);

            double_check.computeFoldersHashes(folderPath, (err, newHashes) => {
                assert.true(err === null || typeof err === "undefined", "Failed to compute folder hashes.");
                assert.hashesAreEqual(this.initialHashes, newHashes, "The extracted files are not te same as the initial ones");

                double_check.deleteFoldersSync(folderPath);
                this.callback();
            });
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

    folderPath = path.join(testFolder, "fld");
    filePath = path.join(testFolder, "fld/a.txt");
    savePath = path.join(testFolder, "dot");


    folders = ["fld"].map(folder => path.join(testFolder, folder));
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));

    assert.callback("Bar smoke test", (callback) => {
        $$.flows.start("barTest", "start", callback);
    }, 3000);
});