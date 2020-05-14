require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Read file from dossier test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        const edfs = EDFS.attachToEndpoint(EDFS_HOST);

        edfs.createRawDossier((err, dossier) => {
            if (err) {
                throw err;
            }

            dossier.writeFile("just_a_path", "some_content", (err) => {
                if (err) {
                    throw err;
                }

                edfs.createRawDossier((err, newDossier) => {
                    if (err) {
                        throw err;
                    }

                    newDossier.writeFile("testFile", "testContent", (err) => {
                        assert.true(typeof err === "undefined");

                        dossier.mount("/code/constitution", newDossier.getSeed(), (err) => {
                            if (err) {
                                throw err;
                            }
                            assert.true(typeof err === "undefined");

                            dossier.readFile("/code/constitution/testFile", (err, data) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(typeof err === "undefined");
                                assert.true(data.toString() === "testContent");
                                testFinishCallback();
                            });
                        });
                    });
                })

            });

        })
    });
}, 5000);
