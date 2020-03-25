require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Read file from dossier test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        const edfs = EDFS.attachToEndpoint(EDFS_HOST);

        const dossier = edfs.createCSB();
        dossier.writeFile("just_a_path", "some_content", (err) => {
            if (err) {
                throw err;
            }

            const newDossier = edfs.createCSB();
            newDossier.writeFile("testFile", "testContent", (err) => {
                assert.true(typeof err === "undefined");


                dossier.mount("/", "constitution", newDossier.getSeed(), (err) => {
                    assert.true(typeof err === "undefined");

                    dossier.readFile("/constitution/testFile", (err, data) => {
                        assert.true(typeof err === "undefined");
                        assert.true(data.toString() === "testContent");
                        testFinishCallback();
                    });
                });
            });

        });
    });
}, 5000);