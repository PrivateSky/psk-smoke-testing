require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("bar_delete_content", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("BasicBarFunctionality", (callback) => {
        tir.launchVirtualMQNode(10, testFolder, (err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const openDSU = require("opendsu");
            const resolver = openDSU.loadApi("resolver");
            const keySSISpace = openDSU.loadApi("keyssi");

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, bar) => {
                if (err) {
                    throw err;
                }

                let counter = 0;
                bar.delete("/", (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log("Finished empty bar delete")
                    assert.equal(err, undefined);

                    bar.writeFile("a.txt", fileData, (err, brickMapDigest) => {
                        console.log("Written data");
                        if (err) {
                            console.log(err);
                            return;
                        }
                        counter++;

                        bar.delete("/", (err) => {
                            assert.equal(counter, 1, "Bar callback was called twice")

                            if (err) {
                                console.log("First bar delete");
                                //TODO: Check why writeFile callback function is called two times when throw err is executed
                                // throw err;
                            }
                            callback();
                        })
                    })

                })
            })
        });
    }, 2000);
});


