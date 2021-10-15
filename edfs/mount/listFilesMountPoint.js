require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const double_check = require("double-check")
const assert = double_check.assert;

assert.callback("Test list files from a mount point", (testFinishCallback) => {
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
                const fileName = 'simpleFile';
                ref.writeFile(fileName, "withcontent", (err) => {
                    if (err) {
                        throw err;
                    }

                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, raw_dossier) => {

                        if (err) {
                            throw err;
                        }

                        ref.getKeySSIAsString((err, refKeySSI) => {
                            if (err) {
                                throw err;
                            }
                            raw_dossier.mount("/code/test", refKeySSI, (err) => {
                                if (err) {
                                    throw err;
                                }
                                raw_dossier.writeFile("just_a_path", "some_content", function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    raw_dossier.getKeySSIAsString((err, raw_dossierKeySSI) => {
                                        if (err) {
                                            throw err;
                                        }
                                        resolver.loadDSU(raw_dossierKeySSI, (err, raw_dossier_reloaded) => {
                                            raw_dossier_reloaded.listFiles("/code/test", (err, files) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                assert.true(typeof err === "undefined");
                                                assert.true(files.length === 2);
                                                assert.true(files[1] === fileName);
                                                testFinishCallback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, 5000);
