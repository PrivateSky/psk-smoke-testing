require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("rawDossier restore test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);
        edfs.createRawDossier((err, ref) => {
            if (err) {
                throw err;
            }

            ref.addFolder("../../../psknode/bundles", "/constitution", (err) => {
                if (err) {
                    throw err;
                }

                edfs.loadRawDossier(ref.getSeed(), (err, ref2) => {
                    if (err) {
                        throw err;
                    }
                    ref2.readFile("/constitution/edfsBar.js", function (err, content) {
                        if (err) {
                            throw err;
                        }
                        assert.true(content !== "");
                        testFinishCallback();
                    });
                });
            });
        })
    });
}, 5000);
