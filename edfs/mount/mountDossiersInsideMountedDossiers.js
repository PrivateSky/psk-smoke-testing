require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - mount multiple dossiers into other mounted dossiers", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }

        const EDFS = require("edfs");
        $$.BDNS.addConfig("default", {
            endpoints: [
                {
                    endpoint: `http://localhost:${port}`,
                    type: 'brickStorage'
                },
                {
                    endpoint: `http://localhost:${port}`,
                    type: 'anchorService'
                }
            ]
        })
        EDFS.createDSU("RawDossier", (err, rawDossier) => {
            if (err) {
                throw err;
            }

            EDFS.createDSU("RawDossier", (err, dossier1) => {
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

                        EDFS.createDSU("RawDossier", (err, dossier2) => {
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
                                        assert.true(content[1].path === 'dossier1');

                                        dossier1.readDir('/', (err, content) => {
                                            if (err) {
                                                throw err;
                                            }
                                            assert.true(content[1].path === 'dossier2');

                                            EDFS.createDSU("RawDossier", (err, dossier3) => {
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

                                                    EDFS.resolveSSI(dossier1KeySSI, "RawDossier", (err, dossier1Loaded) => {
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
                                                                assert.true(content[1].path === 'dossier2');
                                                                assert.true(content[2].path === 'dossier4');

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