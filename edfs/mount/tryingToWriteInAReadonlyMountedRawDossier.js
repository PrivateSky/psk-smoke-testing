require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Trying to write in a readonly mounted RawDossier", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);
        let ref = edfs.createRawDossier();
        const fileName = 'simpleFile';
        const folderName = "/dir";
        ref.writeFile(fileName, "withcontent", (err) => {
            if (err) {
                throw err;
            }
            let raw_dossier = edfs.createRawDossier();
            raw_dossier.mount(folderName + "/test", ref.getSeed(), (err) => {
                if (err) {
                    throw err;
                }

                raw_dossier.writeFile(folderName + "/test/anotherFile", "some data", {ignoreMounts: false}, (err) => {
                    assert.true(typeof err === "undefined");
                    testFinishCallback();
                });
            });

        });
    });
}, 5000);