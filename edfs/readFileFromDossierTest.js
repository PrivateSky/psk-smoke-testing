require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Read file from dossier test", (testFinishCallback) => {
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

                dossier.writeFile("just_a_path", "some_content", (err) => {
                    if (err) {
                        throw err;
                    }

                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, newDossier) => {
                        if (err) {
                            throw err;
                        }

                        newDossier.writeFile("testFile", "testContent", (err) => {
                            assert.true(typeof err === "undefined");

                            newDossier.getKeySSIAsString((err, keySSI) => {
                                if (err) {
                                    throw err;
                                }
                                dossier.mount("/code/constitution", keySSI, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    assert.true(typeof err === "undefined");

                                    dossier.readFile("/code/constitution/testFile", (err, data) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(typeof err === "undefined");
                                        assert.true(data.toString() === "testContent");
                                        testFinishCallback();
                                    });
                                });
                            });
                        });
                    })
                });
            })
        })
    });
}, 5000);
