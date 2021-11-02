require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback("Trying to write in a readonly mounted RawDossier", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            const fileName = 'simpleFile';
            const folderName = "/dir";
            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, ref) => {
                if (err) {
                    throw err;
                }
                ref.writeFile(fileName, "withcontent", (err) => {
                    if (err) {
                        throw err;
                    }
                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, raw_dossier) => {
                        if (err) {
                            throw err;
                        }

                        ref.getKeySSIAsString((err, keySSI) => {
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
        })
    });
}, 5000);
