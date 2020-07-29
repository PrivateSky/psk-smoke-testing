require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Missing first letter from file name", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

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
        EDFS.createDSU("RawDossier",(err, ref) => {
            if (err) {
                throw err;
            }
            ref.addFolder("..//..", "/app", {encrypt: true, depth: 0}, (err) => {
                assert.true(typeof err === "undefined");
                testFinishCallback();
            });
        })
    });
}, 5000);
