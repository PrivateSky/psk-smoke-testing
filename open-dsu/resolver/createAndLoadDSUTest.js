require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Create and load DSU test", (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keyssi = openDSU.loadApi("keyssi");
        const seedSSI = keyssi.buildTemplateSeedSSI("default",  undefined, undefined, "v0", "hint");

        resolver.createDSU(seedSSI, (err, rawDossier) => {
            if (err) {
                throw err;
            }

            rawDossier.writeFile("/a.txt", "some data", (err) => {
                if (err) {
                    throw err;
                }

                rawDossier.getKeySSIAsString((err, keySSI) => {
                    if (err) {
                        throw err;
                    }

                    resolver.loadDSU(keySSI, (err, loadedDSU) => {
                        if (err) {
                            throw err;
                        }


                        loadedDSU.getKeySSIAsString((err, cloneKeySSI) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(keySSI === cloneKeySSI);

                            loadedDSU.readFile("/a.txt", (err, data) => {
                                if (err) {
                                    throw err;
                                }
                                callback();
                            });
                        });
                    });
                });
            });

        });
    });
}, 10000);