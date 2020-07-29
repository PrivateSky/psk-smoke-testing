require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Test list files from a mount point", (testFinishCallback) => {
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
        EDFS.createDSU("RawDossier", (err, ref) => {
            if (err) {
                throw err;
            }
            const fileName = 'simpleFile';
            ref.writeFile(fileName, "withcontent", (err) => {
                if (err) {
                    throw err;
                }

                EDFS.createDSU("RawDossier", (err, raw_dossier) => {

                    if (err) {
                        throw err;
                    }

                    raw_dossier.mount("/code/test", ref.getKeySSI(), (err) => {
                        if (err) {
                            throw err;
                        }
                        raw_dossier.writeFile("just_a_path", "some_content", function (err) {
                            if (err) {
                                throw err;
                            }
                            assert.true(typeof err === "undefined");
                            EDFS.resolveSSI(raw_dossier.getKeySSI(), "RawDossier", (err, raw_dossier_reloaded) => {
                                raw_dossier_reloaded.listFiles("/code/test", (err, files) => {
                                    if (err) {
                                        throw err;
                                    }
                                    assert.true(typeof err === "undefined");
                                    assert.true(files.length === 1);
                                    assert.true(files[0] === fileName);
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
