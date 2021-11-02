require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("mount - trying to mount into an existing mounting point path", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require('opendsu');
            const keySSISpace = openDSU.loadApi('keyssi');
            const resolver = openDSU.loadApi('resolver');

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, rawDossier) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dossier1) => {
                    if (err) {
                        throw err;
                    }

                    dossier1.getKeySSIAsString((err, dossier1KeySSI) => {
                        if (err) {
                            throw err;
                        }
                        rawDossier.mount('/dossier1', dossier1KeySSI, (err) => {
                            if (err) {
                                throw err;
                            }

                            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dossier2) => {
                                if (err) {
                                    throw err;
                                }

                                dossier2.getKeySSIAsString((err, dossier2KeySSI) => {
                                    if (err) {
                                        throw err;
                                    }
                                    rawDossier.mount('/dossier1/dossier2', dossier2KeySSI, (err) => {
                                        if (err) {
                                            assert.true(err && err.message === 'Mount not allowed. Already exist a mount for /dossier1');
                                            return testFinishCallback();
                                        }

                                        // The test stops in the above error because /dossier1 already is inside the mounting points of the rawDossier.
                                        // I want to have dossier2 mounted into dossier1 using the above behaviour, not by using the inner dossier (dossier1) like on the current implemented behaviour.

                                        // In the end I wish the following test to pass:

                                        rawDossier.readDir('/', (err, content) => {
                                            if (err) {
                                                throw err;
                                            }

                                            assert.true(content[2].path === 'dossier1');

                                            rawDossier.readDir('/dossier1', (err, content) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                assert.true(content[2].path === 'dossier2');

                                                dossier1.readDir('/', (err, content) => {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    assert.true(content[2].path === 'dossier2');
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
    });
}, 5000);