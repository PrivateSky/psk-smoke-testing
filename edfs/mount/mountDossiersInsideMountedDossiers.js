require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - mount multiple dossiers into other mounted dossiers", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);

        edfs.createRawDossier((err, rawDossier) => {
            if (err) {
                throw err;
            }

            edfs.createRawDossier((err, dossier1) => {
                if (err) {
                    throw err;
                }

                rawDossier.mount('/dossier1', dossier1.getSeed(), (err) => {
                    if (err) {
                        throw err;
                    }

                    edfs.createRawDossier((err, dossier2) => {
                        if (err) {
                            throw err;
                        }

                        dossier1.mount('/dossier2', dossier2.getSeed(), (err) => {
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

                                    edfs.createRawDossier((err, dossier3) => {
                                        if (err) {
                                            throw err;
                                        }

                                        rawDossier.mount('/dossier3', dossier3.getSeed(), (err) => {
                                            if (err) {
                                                throw err;
                                            }

                                            edfs.loadRawDossier(dossier1.getSeed(), (err, dossier1Loaded) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                dossier1Loaded.mount('/dossier4', dossier3.getSeed(), (err) => {
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
}, 5000);