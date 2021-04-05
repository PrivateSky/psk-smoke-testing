require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;
const openDSU = require("opendsu");

const tir = require("../../../../psknode/tests/util/tir.js");

require("callflow").initialise();

$$.flows.describe("CloneFolder", {
    start: function (callback) {
        this.callback = callback;

        tir.launchApiHubTestNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            this.createDSU();
        });

    },

    createDSU: function () {
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            this.dsu = dsu;
            this.addFiles();
        })
    },

    addFiles: function () {
        this.dsu.writeFile("fld/file1", "some_data", (err, result) => {
            if (err) {
                throw err;
            }
            this.dsu.writeFile("fld/file2", "some_other_data", (err, result) => {
                if (err) {
                    throw err;
                }

                this.dsu.cloneFolder("fld", "fld2", () => {
                    this.loadDSU();
                });
            })
        })
    },

    loadDSU: function () {
        const resolver = openDSU.loadApi("resolver");
        this.dsu.getKeySSIAsObject((err, keySSI) => {
            resolver.loadDSU(keySSI, (err, dsu) => {
                this.runAssertions(dsu);
            });
        });
    },

    runAssertions: function (dsu) {
        dsu.listFiles('fld2', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.length === 2);
            assert.true(files.indexOf('file1') !== -1);
            assert.true(files.indexOf('file2') !== -1);

            dsu.readFile("fld2/file1", (err, data) => {
                assert.true(data.toString(), "some_data");
                this.callback();
            });
        });
    }
});

assert.callback("Clone folder test", (callback) => {
    $$.flows.start("CloneFolder", "start", callback);
}, 3000);
