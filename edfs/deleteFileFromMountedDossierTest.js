require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Delete file from mounted dossier test", (testFinishCallback) => {
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

                            newDossier.getKeySSIAsString((err, newDossierKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                dossier.mount("/code/constitution", newDossierKeySSI, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    assert.true(typeof err === "undefined");

                                    dossier.listFiles("/code/constitution", (err, files) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(files.length === 2, "Unexpected files length");
                                        dossier.delete("/code/constitution/testFile", {ignoreMounts: false}, (err) => {
                                            if (err) {
                                                throw err;
                                            }
                                            dossier.listFiles("/code/constitution", (err, files) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                assert.true(files.length === 1, "Unexpected files length");
                                                testFinishCallback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    })

                });
            });
        })
    });
}, 5000);
