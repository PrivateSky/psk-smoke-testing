require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Trying to write in a readonly mounted RawDossier", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        const bdns = openDSU.loadApi("bdns");
        bdns.addRawInfo("default", {
            brickStorages: [`http://localhost:${port}`],
            anchoringServices: [`http://localhost:${port}`]
        });

        const fileName = 'simpleFile';
        const folderName = "/dir";
        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, ref) => {
            if (err) {
                throw err;
            }
            ref.writeFile(fileName, "withcontent", (err) => {
                if (err) {
                    throw err;
                }
                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, raw_dossier) => {
                    if (err) {
                        throw err;
                    }

                    ref.getKeySSI((err, keySSI) => {
                        if (err) {
                            throw err;
                        }
                        raw_dossier.mount(folderName + "/test", keySSI, (err) => {
                            if (err) {
                                throw err;
                            }

                            raw_dossier.writeFile(folderName + "/test/anotherFile", "some data", {ignoreMounts: false}, (err) => {
                                assert.true(typeof err === "undefined");
                                testFinishCallback();
                            });
                        });
                    })
                })
            });
        })
    });
}, 5000);
