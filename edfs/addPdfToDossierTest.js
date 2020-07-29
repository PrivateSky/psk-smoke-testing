require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;
const fs = require("fs");

const file = fs.createWriteStream("./bigFile.pdf");
for (let i = 0; i <= 1e5; i++) {
    file.write('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n');
}

file.end();

assert.callback("Add PDF to dossier test", (testFinishCallback) => {
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
        EDFS.createDSU("RawDossier", (err, ref) => {
            if (err) {
                throw err;
            }

            ref.addFile("./bigFile.pdf", "/file", (err) => {
                if (err) {
                    throw err;
                }

                EDFS.resolveSSI(ref.getKeySSI(),"RawDossier", (err, dossierClone) => {
                    if (err) {
                        throw err;
                    }

                    dossierClone.extractFile("./myProspect.pdf", "/file", (err) => {
                        if (err) {
                            throw err;
                        }
                        const originalSize = fs.statSync("./bigFile.pdf").size;
                        const newSize = fs.statSync("./myProspect.pdf").size;
                        assert.true(originalSize === newSize);
                        fs.unlinkSync("./bigFile.pdf");
                        fs.unlinkSync("./myProspect.pdf");
                        testFinishCallback();
                    });
                });
            });
        })
    });
}, 20000);
