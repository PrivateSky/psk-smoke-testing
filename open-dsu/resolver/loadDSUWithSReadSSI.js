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
        const seedSSI = keyssi.createTemplateSeedSSI("default", undefined, undefined, "v0", "hint");

        resolver.createDSU(seedSSI, (err, rawDossier) => {
            if (err) {
                throw err;
            }

            rawDossier.writeFile("/a.txt", "some data", (err) => {
                if (err) {
                    throw err;
                }

                rawDossier.getKeySSIAsString("sread", (err, sreadSSI) => {
                    if (err) {
                        throw err;
                    }

                    resolver.loadDSU(sreadSSI, (err, loadedDSU) => {
                        if (err) {
                            throw err;
                        }


                        loadedDSU.getKeySSIAsString((err, cloneKeySSI) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(sreadSSI === cloneKeySSI);
                            callback();
                        });
                    });

                });
            });
        });
    });
}, 15000);
