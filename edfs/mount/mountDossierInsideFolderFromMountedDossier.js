require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - mount dossier inside a folder of a mounted dossier", (testFinishCallback) => {
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

                dossier1.writeFile('/folder1/file1.txt', 'text', (err) => {
                    if (err) {
                        throw err;
                    }

                    dossier1.getKeySSI((err, keySSI) => {
                        if (err) {
                            throw err;
                        }
                        rawDossier.mount('/folder1/dossier1', keySSI, (err) => {
                            if (err) {
                                throw err;
                            }

                            rawDossier.listMountedDossiers('', (err, content) => {
                                if (err) {
                                    throw err;
                                }

                                rawDossier.listMountedDossiers('/folder1', (err, content) => {
                                    if (err) {
                                        throw err;
                                    }

                                    testFinishCallback();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, 5000);