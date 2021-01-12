require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - mount multiple dossiers into other mounted dossiers", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }

        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, rawDossier) => {
            if (err) {
                throw err;
            }

            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dossier1) => {
                if (err) {
                    throw err;
                }

                dossier1.getKeySSI((err, dossier1KeySSI) => {
                    if (err) {
                        throw err;
                    }
                    rawDossier.mount('/dossier1', dossier1KeySSI, (err) => {
                        if (err) {
                            throw err;
                        }

                        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dossier2) => {
                            if (err) {
                                throw err;
                            }
                            dossier2.getKeySSI((err, dossier2KeySSI) => {
                                if (err) {
                                    throw err;
                                }
                                dossier1.mount('/dossier2', dossier2KeySSI, (err) => {
                                    if (err) {
                                        throw err;
                                    }

                                    rawDossier.readDir('/', (err, content) => {
                                        if (err) {
                                            throw err;
                                        }
                                        assert.true(content[2].path === 'dossier1');

                                        dossier1.readDir('/', (err, content) => {
                                            if (err) {
                                                throw err;
                                            }
                                            assert.true(content[2].path === 'dossier2');

                                            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dossier3) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                dossier3.getKeySSI((err, dossier3KeySSI) => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                rawDossier.mount('/dossier3', dossier3KeySSI, (err) => {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    resolver.loadDSU(dossier1KeySSI, (err, dossier1Loaded) => {
                                                        if (err) {
                                                            throw err;
                                                        }

                                                        dossier1Loaded.mount('/dossier4', dossier3KeySSI, (err) => {
                                                            if (err) {
                                                                throw err;
                                                            }

                                                            dossier1Loaded.readDir('/', (err, content) => {
                                                                if (err) {
                                                                    throw err;
                                                                }
                                                                assert.true(content[2].path === 'dossier2');
                                                                assert.true(content[3].path === 'dossier4');

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
                });
            });
        });
    });
}, 5000);