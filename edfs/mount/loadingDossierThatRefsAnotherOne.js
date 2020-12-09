require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Load a dossier that was a mount point to a dossier with constitution code.", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }

        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, ref) => {
            if (err) {
                throw err;
            }
            ref.addFolder("../../../../psknode/bundles", "/", (err) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, raw_dossier) => {
                    if (err) {
                        throw err;
                    }

                    const fileContent = "$$.transactions.describe('echo', {\n" +
                        "\t\tsay: function (message) {\n" +
                        "\t\t\tthis.return(undefined, message);\n" +
                        "\t\t}\n" +
                        "\t}\n" +
                        ");";
                    ref.writeFile("domain.js", fileContent, function (err) {
                        if (err) {
                            throw err;
                        }

                        ref.getKeySSI((err, refKeySSI) => {
                            if (err) {
                                throw err;
                            }
                            raw_dossier.mount("/code/constitution", refKeySSI, (err) => {
                                assert.true(typeof err === "undefined" || err === null);
                                raw_dossier.writeFile("just_a_file", "fileContent", function (err) {
                                    if (err) {
                                        throw err;
                                    }
                                    raw_dossier.getKeySSI((err, raw_dossierKeySSI) => {
                                        if (err) {
                                            throw err;
                                        }

                                        resolver.loadDSU(raw_dossierKeySSI, (err, handler) => {
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
                })

            });
        })
    });
}, 10000);

