require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Trying to write in a readonly mounted RawDossier", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS = require("edfs");
        $$.BDNS.addConfig("default", {
            endpoints: [
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'brickStorage'
                },
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'anchorService'
                }
            ]
        })
        const fileName = 'simpleFile';
        const folderName = "/dir";
        EDFS.createDSU("RawDossier", (err, ref) => {
            if (err) {
                throw err;
            }
            ref.writeFile(fileName, "withcontent", (err) => {
                if (err) {
                    throw err;
                }
                EDFS.createDSU("RawDossier", (err, raw_dossier) => {
                    if (err) {
                        throw err;
                    }
                    raw_dossier.mount(folderName + "/test", ref.getKeySSI(), (err) => {
                        if (err) {
                            throw err;
                        }

                        raw_dossier.writeFile(folderName + "/test/anotherFile", "some data", {ignoreMounts: false}, (err) => {
                            assert.true(typeof err === "undefined");
                            testFinishCallback();
                        });
                    });
                })

            });
        })
    });
}, 5000);
