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
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);

        let bar = edfs.createBar();
        console.log("Early seed read", bar.getSeed());
        bar.writeFile("just_a_path", "some_content", function (err) {
            assert.true(typeof err === "undefined");

            testFinishCallback();
        });
    });
}, 5000);