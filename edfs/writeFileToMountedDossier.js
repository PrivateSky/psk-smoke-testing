require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("rawDossier - write file into a mounted dossier", (testFinishCallback) => {
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
        EDFS.createDSU("RawDossier", (err, ref) => {
            if (err) {
                throw err;
            }

            ref.writeFile("text.txt", "some text for a complex test", (err) => {
                if (err) {
                    throw err;
                }

                EDFS.createDSU("RawDossier", (err, newDossier) => {
                    if (err) {
                        throw err;
                    }

                    newDossier.writeFile("/tempFile", "", (err) => {
                        if (err) {
                            throw err;
                        }

                        newDossier.getKeySSI((err, newDossierKeySSI) => {
                            if (err) {
                                throw err;
                            }
                            ref.mount('/dossier', newDossierKeySSI, (err) => {
                                if (err) {
                                    throw err;
                                }

                                ref.getKeySSI((err, refKeySSI) => {
                                    if (err) {
                                        throw err;
                                    }
                                    EDFS.resolveSSI(refKeySSI, "RawDossier", (err, ref2) => {
                                        if (err) {
                                            throw err;
                                        }
                                        ref2.writeFile("/dossier/file.txt", 'some text for a file inside a mounted dossier', {
                                            ignoreMounts: false,
                                            encrypt: true
                                        }, function (err) {
                                            if (err) {
                                                throw err;
                                            }

                                            newDossier.load((err) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                newDossier.readFile('/file.txt', (err, content) => {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    assert.true(content.toString() === 'some text for a file inside a mounted dossier');
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
        })
    });
}, 10000);