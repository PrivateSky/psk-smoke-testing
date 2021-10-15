require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");
require("callflow").initialise();
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const keySSISpace = openDSU.loadApi("keyssi");

$$.flows.describe("CreateEmptyFile", {
    start: function (callback) {
        this.callback = callback;

        double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
            tir.launchApiHubTestNode(100, folder, async err => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.createDSU();
            });
        });
    },

    createDSU: function () {

        console.log("Started creating DSU");
        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            console.log("Started creating file /fld/somePath");
            this.writeFiles(dsu, () => {
                this.deleteFiles(dsu);
            });
        })
    },

    writeFiles: function (dsu, callback) {
        dsu.writeFile("/fld/somePath", (err, result) => {
            if (err) {
                throw err;
            }
            console.log("created file /fld/somePath")
            console.log("Started creating file /fld/somePath1");
            dsu.writeFile("/fld/somePath1", (err, result) => {
                if (err) {
                    return callback(err);
                }

                // console.log("created file /fld/somePath1")
                callback();
            })
        })
    },

    deleteFiles(dsu) {
        dsu.delete("/fld/somePath", (err, result) => {
            if (err) {
                throw err;
            }
            console.log("deleted file /fld/somePath")
            dsu.delete("/fld/somePath1", (err, result) => {
                if (err) {
                    throw err;
                }

                // console.log("created file /fld/somePath1")
                this.createDSUCopy(dsu);
            })
        })
    },

    createDSUCopy: function (dsu) {
        this.writeFiles(dsu, () => {
            dsu.getKeySSIAsObject((err, keySSI) => {
                if (err) {
                    console.log(err);
                }
                resolver.loadDSU(keySSI, (err, copyDSU) => {
                    if (err) {
                        console.log(err);
                    }

                    this.runAssertions(dsu);
                });
            });
        });
    },
    runAssertions: function (dsu) {
        dsu.listFiles('/fld', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.length === 2);
            assert.true(files.indexOf("somePath") !== -1);
            assert.true(files.indexOf("somePath1") !== -1);

            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.callback("Create empty file test", (callback) => {
        $$.flows.start("CreateEmptyFile", "start", callback);
    }, 3000);
});
