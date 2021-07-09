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

                let callbackCallCounter = 0;
                bar.delete("/", (err) => {
                    if (err) {
                        throw err;
                    }
                    assert.equal(err, undefined, 'Bar was emptied');

                    bar.writeFile("a.txt", fileData, (err, brickMapDigest) => {
                        assert.equal(err, undefined, 'File was written');
                        callbackCallCounter++;

                        bar.delete("/", (err) => {
                            assert.equal(callbackCallCounter, 1, "The parent callback was not called a second time");
                            assert.equal(err, undefined, 'Bar was emptied again')
                            callback();
                        })
                    })

                })
            })
        });
    }, 2000);
});


