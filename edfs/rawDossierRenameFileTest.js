require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Rename file in dossier", (testFinishCallback) => {
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

            dossier.writeFile("/my/file/just_a_path", "some_content", (err) => {
                if (err) {
                    throw err;
                }

                dossier.rename('/my/file/just_a_path', '/folder/renamed_file', (err) => {
                    if (err) {
                        throw err;
                    }

                    dossier.readFile('/folder/renamed_file', (err, data) => {
                        if (err) {
                            throw err;
                        }

                        dossier.rename('/folder', '/renamed/folder', (err) => {
                            if (err) {
                                throw err;
                            }

                            dossier.readFile('/renamed/folder/renamed_file', (err, data) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(data.toString() === "some_content");
                                testFinishCallback();
                            })
                        })
                    })
                })
            });
        })
    });
}, 5000);
