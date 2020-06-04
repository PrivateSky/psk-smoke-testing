require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - mount dossier inside a folder of a mounted dossier", (testFinishCallback) => {
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

                dossier1.writeFile('/folder1/file1.txt', 'text', (err) => {
                    if (err) {
                        throw err;
                    }

                    rawDossier.mount('/folder1/dossier1', dossier1.getSeed(), (err) => {
                        if (err) {
                            throw err;
                        }

                        rawDossier.listMountedDossiers('', (err, content) => {
                            if (err) {
                                throw err;
                            }
                            console.log(content);

                            rawDossier.listMountedDossiers('/folder1', (err, content) => {
                                if (err) {
                                    throw err;
                                }

                                console.log(content);
                                testFinishCallback();
                            });
                        });
                    });
                });
            });
        });
    });
}, 5000);