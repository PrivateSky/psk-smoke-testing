require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Rename file in dossier", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dossier) => {
                if (err) {
                    throw err;
                }

                dossier.writeFile("/my/file/just_a_path", "some_content", (err) => {
                    if (err) {
                        throw err;
                    }

                    dossier.rename('/my/file/just_a_path', '/folder/renamed_file', (err) => {
                        if (err) {
                            throw err;
                        }

                        dossier.readFile('/folder/renamed_file', (err, data) => {
                            if (err) {
                                throw err;
                            }

                            dossier.rename('/folder', '/renamed/folder', (err) => {
                                if (err) {
                                    throw err;
                                }

                                dossier.readFile('/renamed/folder/renamed_file', (err, data) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(data.toString() === "some_content");
                                    testFinishCallback();
                                })
                            })
                        })
                    })
                });
            })
        })
    });
}, 5000);
