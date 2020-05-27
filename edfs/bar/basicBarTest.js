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

    assert.callback("BasicBarFunctionality", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, serverPort) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const edfs = EDFS.attachToEndpoint("http://localhost:" + serverPort);

            edfs.createBar((err, bar) => {
                if (err) {
                    throw err;
                }

                bar.writeFile("/x/y/z/a.txt", fileData, (err, barMapDigest) => {
                    if (err) {
                        throw err;
                    }
                    assert.true(err === null || typeof err === "undefined", "Failed to write file in BAR");
                    assert.true(barMapDigest !== null && typeof barMapDigest !== "undefined", "Bar map digest is null or undefined");

                    edfs.loadBar(bar.getSeed(), (err, newBar) => {
                        if (err) {
                            throw err;
                        }
                        newBar.readFile("/x/y/z/a.txt", (err, data) => {
                            assert.true(err === null || typeof err === "undefined", "Failed read file from BAR.");
                            assert.true(fileData === data.toString(), "Invalid read data");

                            newBar.writeFile('/x/y/z/a.txt', 'test', (err) => {
                                assert.true(err === null || typeof err === "undefined", "Failed read file from BAR. 2");

                                newBar.readFile("/x/y/z/a.txt", (err, data) => {
                                    assert.true(err === null || typeof err === "undefined", "Failed read file from BAR. 2");
                                    assert.true('test' === data.toString(), "Invalid read data 2");

                                    newBar.listFiles('/', (err, data) => {

                                        newBar.listFolders('/', (err, data) => {

                                            callback();
                                        })
                                    });
                                });
                            });
                        });
                    })
                });
            })
        });
    }, 2000);
});


