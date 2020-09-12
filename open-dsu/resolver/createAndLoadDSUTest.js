require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/openDSU");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
assert.callback("Create and load DSU test", (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }

        const bdns = openDSU.loadApi("bdns");
        const keyssi = openDSU.loadApi("keyssi");
        const seedSSI = keyssi.buildSeedSSI("localDomain",  undefined, undefined, "v0", "hint");
        bdns.addRawInfo("localDomain", {
            brickStorages: [`http://localhost:${port}`],
            anchoringServices: [`http://localhost:${port}`]
        })

        resolver.createDSU(seedSSI, (err, rawDossier) => {
            if (err) {
                throw err;
            }

            rawDossier.writeFile("/a.txt", "some data", (err) => {
                if (err) {
                    throw err;
                }

                rawDossier.getKeySSI((err, keySSI) => {
                    if (err) {
                        throw err;
                    }

                    resolver.loadDSU(keySSI, (err, loadedDSU) => {
                        if (err) {
                            throw err;
                        }


                        loadedDSU.getKeySSI((err, cloneKeySSI) => {
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