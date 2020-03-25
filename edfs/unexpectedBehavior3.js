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
        let ref = edfs.createCSB();
        ref.addFile("./unexpectedBehavir.js", "justAfile", {encrypt: false, depth: 0}, () => {
            let raw_dossier = edfs.createCSB();
            raw_dossier.mount("/", "test", ref.getSeed(), (err) => {
                assert.true(typeof err === "undefined");
                raw_dossier.writeFile("just_a_path", "some_1content", {depth: 0}, function (err) {
                    assert.true(typeof err === "undefined");

                    raw_dossier.listFiles("/test", (err, files) => {
                        assert.true(typeof err === "undefined");
                        assert.true(files.length === 1);
                        testFinishCallback();
                    });
                });
            });
        });
    });
}, 5000);