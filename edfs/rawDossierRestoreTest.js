require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;
assert.callback("rawDossier restore test", (testFinishCallback) => {
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

                ref.addFolder("../../../psknode/bundles", "/constitution", (err) => {
                    if (err) {
                        throw err;
                    }

                    ref.getKeySSIAsString((err, refKeySSI) => {
                        if (err) {
                            throw err;
                        }
                        resolver.loadDSU(refKeySSI, (err, ref2) => {
                            if (err) {
                                throw err;
                            }
                            ref2.readFile("/constitution/pskruntime.js", function (err, content) {
                                if (err) {
                                    throw err;
                                }
                                assert.true(content !== "");
                                testFinishCallback();
                            });
                        });
                    });
                });
            })
        })
    });
}, 5000);
