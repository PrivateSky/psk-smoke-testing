require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Delete file from mounted dossier test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        $$.BDNS.addConfig("default", {
            endpoints: [
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'brickStorage'
                },
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'anchorService'
                }
            ]
        })

        EDFS.createDSU("RawDossier",(err, dossier) => {
            if (err) {
                throw err;
            }

            dossier.writeFile("just_a_path", "some_content", (err) => {
                if (err) {
                    throw err;
                }

                EDFS.createDSU("RawDossier",(err, newDossier) => {
                    if (err) {
                        throw err;
                    }

                    newDossier.writeFile("testFile", "testContent", (err) => {
                        assert.true(typeof err === "undefined");

                        dossier.mount("/code/constitution", newDossier.getKeySSI(), (err) => {
                            if (err) {
                                throw err;
                            }
                            assert.true(typeof err === "undefined");

                            dossier.listFiles("/code/constitution", (err, files) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(files.length === 1, "Unexpected files length");
                                assert.arraysMatch(["testFile"], files, "Unexpected files list");
                                dossier.delete("/code/constitution/testFile", {ignoreMounts: false}, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    dossier.listFiles("/code/constitution", (err, files) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(files.length === 0, "Unexpected files length");
                                        testFinishCallback();
                                    });
                                });
                            });
                        });
                    });
                })

            });

        })
    });
}, 5000);
