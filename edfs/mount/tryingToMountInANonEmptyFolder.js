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
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);
        let ref = edfs.createRawDossier();
        const fileName = 'simpleFile';
        const folderName = "dir";
        const subFolder = "folder";
        ref.writeFile(pskPath.ensureIsAbsolute(fileName), "withcontent", (err) => {
            if (err) {
                throw err;
            }
            let raw_dossier = edfs.createRawDossier();
            raw_dossier.writeFile(pskPath.join("/", folderName, subFolder, fileName), "content", (err) => {
                if (err) {
                    throw err;
                }

                raw_dossier.mount(pskPath.join("/", folderName, subFolder), ref.getSeed(), (err) => {
                    assert.true(err && err.message === "Tried to mount in a non-empty folder");
                    testFinishCallback();
                });
            });

        });
    });
}, 5000);