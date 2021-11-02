require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check")
const assert = double_check.assert;
assert.callback("Missing first letter from file name", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, ref) => {
                if (err) {
                    throw err;
                }
                ref.addFolder("..//..", "/app", {encrypt: true, depth: 0}, (err) => {
                    assert.true(typeof err === "undefined");
                    testFinishCallback();
                });
            })
        })
    });
}, 5000);
