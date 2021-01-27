require('../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;
const pskPath = require("swarmutils").path;
const tir = require("../../../psknode/tests/util/tir");

const fileContent = "some content";
const rootFolderName = "firsLevelDir";
const subFolder = "secondLevelDir";
const filename = "file.txt";

require("callflow").initialise();

$$.flows.describe("TestFlow", {
    start: function (callback) {
        this.callback = callback;
        tir.launchVirtualMQNode((err, port) => {
            if (err) {
                throw err;
            }
            this.createRawDossier();
        });
    },

    createRawDossier: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildTemplateSeedSSI("default"), (err, rawDossier) => {
            if (err) {
                throw err;
            }

            this.rawDossier = rawDossier;
            this.rawDossier.writeFile(pskPath.join("/", rootFolderName, filename), fileContent, (err) => {
                if (err) {
                    throw err;
                }

                this.rawDossier.writeFile(pskPath.join("/", rootFolderName, subFolder, filename), fileContent, (err) => {
                    if (err) {
                        throw err;
                    }

                    this.listFiles(this.rawDossier);
                });
            });
        })
    },

    listFiles: function (rawDossier) {
        rawDossier.listFiles(pskPath.join("/", rootFolderName), {recursive: false}, (err, files) => {
            if (err) {
                throw err;
            }
            assert.true(files.length === 1, "Invalid length for file list");
            assert.true(files[0] === filename, "Invalid filename");
            this.listFolders(rawDossier);
        });
    },

    listFolders: function (rawDossier) {
        rawDossier.listFolders(pskPath.join("/", rootFolderName), (err, folders) => {
            if (err) {
                throw err;
            }
            assert.true(folders.length === 1, "Invalid length for folder list");
            assert.true(folders[0] === subFolder, "Invalid folder name");

            console.log("About to exit ===");
            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

    assert.callback("List files and folders from RawDossier test", (callback) => {
            $$.flows.start("TestFlow", "start", callback);
        }, 6000
    );
});
