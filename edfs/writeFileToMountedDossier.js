require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("rawDossier - write file into a mounted dossier", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);
        let ref = edfs.createRawDossier();

        ref.load((err) => {
            if (err) {
                throw err;
            }

            ref.writeFile("text.txt", "some text for a complex test", (err) => {
                if (err) {
                    throw err;
                }

                let newDossier = edfs.createRawDossier();
                newDossier.load((err) => {
                    if (err) {
                        throw err;
                    }
                    ref.mount('/dossier', newDossier.getSeed(), (err) => {
                        if (err) {
                            throw err;
                        }

                        edfs.loadRawDossier(ref.getSeed(), (err, ref2) => {
                            if (err) {
                                throw err;
                            }
                            ref2.writeFile("/dossier/file.txt", 'some text for a file inside a mounted dossier', function (err) {
                                if (err) {
                                    throw err;
                                }

                                newDossier.readFile('file.txt', (err, content) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(content === 'some text for a file inside a mounted dossier');
                                    testFinishCallback();
                                });
                            });
                        });
                    });
                });
            });
        })
    });
}, 10000);