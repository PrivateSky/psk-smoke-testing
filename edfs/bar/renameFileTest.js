require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const EDFS = require("edfs");
const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("RenameFileFunctionality", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, serverPort) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const edfs = EDFS.attachToEndpoint("http://localhost:" + serverPort);

            edfs.createBar((err, bar) => {
                if (err) {
                    throw err;
                }

                bar.writeFile("/x/y/z/a.txt", fileData, (err, brickMapDigest) => {
                    if (err) {
                        throw err;
                    }
                    assert.true(err === null || typeof err === "undefined", "Failed to write file in BAR");
                    assert.true(brickMapDigest !== null && typeof brickMapDigest !== "undefined", "Bar map digest is null or undefined");

                    edfs.loadBar(bar.getSeed(), (err, newBar) => {
                        if (err) {
                            throw err;
                        }
                        newBar.rename("/x/y/z/a.txt", "/b.txt", (err) => {
                            assert.true(err === null || typeof err === "undefined", "Failed rename file.");

                            newBar.readFile("/b.txt", (err, data) => {
                                assert.true(err === null || typeof err === "undefined", "Failed read file from BAR.");
                                assert.true(fileData === data.toString(), "Invalid read data");

                                newBar.readFile('/x/y/z/a.txt', (err, data) => {
                                    assert.true(err !== null && typeof err !== "undefined", "Source file should still exists.");
                                    callback();
                                })
                            });
                        });
                    })
                });
            })
        });
    }, 2000);
});


