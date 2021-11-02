require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const double_check = require("double-check");
const assert = double_check.assert;
const pskPath = require("swarmutils").path;
assert.callback("Trying to mount in a non-empty folder test", (testFinishCallback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
            if (err) {
                throw err;
            }
            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            const fileName = 'simpleFile';
            const folderName = "dir";
            const subFolder = "folder";

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default" +
                ""), (err, ref) => {
                if (err) {
                    throw err;
                }
                ref.writeFile(pskPath.ensureIsAbsolute(fileName), "withcontent", (err) => {
                    if (err) {
                        throw err;
                    }
                    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, raw_dossier) => {
                        if (err) {
                            throw err;
                        }
                        raw_dossier.writeFile(pskPath.join("/", folderName, subFolder, fileName), "content", (err) => {
                            if (err) {
                                throw err;
                            }

                            ref.getKeySSIAsString((err, keySSI) => {
                                if (err) {
                                    throw err;
                                }
                                raw_dossier.mount(pskPath.join("/", folderName, subFolder), keySSI, (err) => {
                                    assert.true(err && err.message === "Tried to mount in a non-empty folder");
                                    testFinishCallback();
                                });
                            });
                        });
                    });


                });
            })
        })
    });
}, 5000);
