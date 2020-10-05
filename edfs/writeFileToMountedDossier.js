require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("rawDossier - write file into a mounted dossier", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        const bdns = openDSU.loadApi("bdns");
        bdns.addRawInfo("default", {
            brickStorages: [`http://localhost:${port}`],
            anchoringServices: [`http://localhost:${port}`]
        });
        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, ref) => {
            if (err) {
                throw err;
            }

            ref.writeFile("text.txt", "some text for a complex test", (err) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, newDossier) => {
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
                                    resolver.loadDSU(refKeySSI, (err, ref2) => {
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