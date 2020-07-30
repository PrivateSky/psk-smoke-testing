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
        const EDFS = require("edfs");
        $$.BDNS.addConfig("default", {
            endpoints: [
                {
                    endpoint: `http://localhost:${port}`,
                    type: 'brickStorage'
                },
                {
                    endpoint: `http://localhost:${port}`,
                    type: 'anchorService'
                }
            ]
        })
        const fileName = 'simpleFile';
        const folderName = "dir";
        const subFolder = "folder";

        EDFS.createDSU("RawDossier", (err, ref) => {
            if (err) {
                throw err;
            }
            ref.writeFile(pskPath.ensureIsAbsolute(fileName), "withcontent", (err) => {
                if (err) {
                    throw err;
                }
                EDFS.createDSU("RawDossier", (err, raw_dossier) => {
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
