require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Rename file in mounted dossier test", (testFinishCallback) => {
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

                                    dossier.readFile("/code/constitution/testFile", (err, data) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(typeof err === "undefined");
                                        assert.true(data.toString() === "testContent");

                                        runRenameTest(dossier, testFinishCallback);
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

function runRenameTest(dossier, callback) {
    dossier.rename('/code/constitution/testFile', '/code/constitution/renamed/file', {
        ignoreMounts: false
    }, (err) => {
        if (err) {
            throw err;
        }

        dossier.readFile('/code/constitution/renamed/file', (err, data) => {
            if (err) {
                throw err;
            }

            assert.true(data.toString() === "testContent");
        })
        callback();
    })
}
