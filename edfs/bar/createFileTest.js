require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let filePath = "/fld/somePath";
const tir = require("../../../../psknode/tests/util/tir.js");
require("callflow").initialise();

$$.flows.describe("CreateEmptyFile", {
    start: function (callback) {
        this.callback = callback;

        tir.launchApiHubTestNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            this.createDSU();
        });
    },

    createDSU: function () {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            this.dsu = dsu;
            this.dsu.createFile(filePath, (err, result) => {
                if (err) {
                    throw err;
                }
                this.runAssertions();
            })
        })
    },
    runAssertions: function () {
        this.dsu.listFiles('/fld', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.length === 1);
            assert.true(files.indexOf("somePath") !== -1);

            this.callback();
        });
    }
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.callback("Create empty file test", (callback) => {
        $$.flows.start("CreateEmptyFile", "start", callback);
    }, 3000);
});
