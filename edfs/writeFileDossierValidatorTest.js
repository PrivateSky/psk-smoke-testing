require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Write file validation in dossier test ", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        const edfs = EDFS.attachToEndpoint(EDFS_HOST);

        const dossier = edfs.createRawDossier();

        let expectedBarMap, expectedBarPath, expectedBricks;

        dossier.setValidator({
            writeRule: function (barMap, barPath, bricks, callback) {
                expectedBarMap = barMap;
                expectedBarPath = barPath;

                assert.true(Array.isArray(bricks));
                expectedBricks = bricks.map((brick) => brick);

                callback();
            }
        })
        dossier.writeFile("just_a_path", "some_content", (err) => {
            if (err) {
                throw err;
            }

            assert.true(expectedBarMap !== undefined);
            assert.true(expectedBarPath === 'just_a_path');
            assert.true(Array.isArray(expectedBricks));
            assert.true(expectedBricks.length > 0);

            const newDossier = edfs.createRawDossier();
            newDossier.writeFile("testFile", "testContent", (err) => {
                assert.true(typeof err === "undefined");


                dossier.mount("/code", "constitution", newDossier.getSeed(), (err) => {
                    assert.true(typeof err === "undefined");

                    dossier.readFile("/code/constitution/testFile", (err, data) => {
                        if (err) {
                            throw err;
                        }
                        assert.true(typeof err === "undefined");
                        assert.true(data.toString() === "testContent");
                        testFinishCallback();
                    });
                });
            });

        });
    });
}, 5000);
