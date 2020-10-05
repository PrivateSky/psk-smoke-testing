require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;
const pskPath = require("swarmutils").path;
assert.callback("Trying to mount in a non-empty folder test", (testFinishCallback) => {
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
        const folderName = "dir";
        const subFolder = "folder";

        resolver.createDSU(keySSISpace.buildSeedSSI("default" +
            ""), (err, ref) => {
            if (err) {
                throw err;
            }
            ref.writeFile(pskPath.ensureIsAbsolute(fileName), "withcontent", (err) => {
                if (err) {
                    throw err;
                }
                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, raw_dossier) => {
                    if (err) {
                        throw err;
                    }
                    raw_dossier.writeFile(pskPath.join("/", folderName, subFolder, fileName), "content", (err) => {
                        if (err) {
                            throw err;
                        }

                        ref.getKeySSI((err, keySSI) => {
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
    });
}, 5000);
