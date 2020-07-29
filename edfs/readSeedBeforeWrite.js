require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("We should be able to get a seed of a bar before finish writing?", (testFinishCallback) => {
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
        EDFS.createDSU("Bar", (err, bar) => {
            if (err) {
                throw err;
            }
            console.log("Early seed read", bar.getKeySSI());
            bar.writeFile("just_a_path", "some_content", function (err) {
                assert.true(typeof err === "undefined");

                testFinishCallback();
            });
        })
    });
}, 5000);
