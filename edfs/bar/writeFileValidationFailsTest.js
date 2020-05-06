require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const EDFS = require("edfs");
const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("bar_test_write_validation_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("BarWriteFileValidationFails", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, serverPort) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const edfs = EDFS.attachToEndpoint("http://localhost:" + serverPort);

            const bar = edfs.createBar();
            bar.setValidator({
                writeRule: (barMap, barPath, bricks, callback) => {
                    return callback(new Error('Validation failed'));
                }
            })

            bar.writeFile("a.txt", fileData, (err, barMapDigest) => {
                assert.true(err instanceof Error, 'Expected error to be thrown while writing file');
                assert.true(err.message === 'Validation failed', 'Expecting error message from validator');


                const newBar = edfs.loadBar(bar.getSeed());
                newBar.readFile("a.txt", (err, data) => {
                    assert.true(typeof err === 'object', "Expecting error while reading file");
                    callback();
                });
            });
        });
    }, 2000);
});


