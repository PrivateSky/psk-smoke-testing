require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Read file from dossier test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }

        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dossier) => {
            if (err) {
                throw err;
            }

            dossier.writeFile("just_a_path", "some_content", (err) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, newDossier) => {
                    if (err) {
                        throw err;
                    }

                    newDossier.writeFile("testFile", "testContent", (err) => {
                        assert.true(typeof err === "undefined");

                        newDossier.getKeySSI((err, keySSI) => {
                            if (err) {
                                throw err;
                            }
                            dossier.mount("/code/constitution", keySSI, (err) => {
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
                    });
                })
            });
        })
    });
}, 5000);
