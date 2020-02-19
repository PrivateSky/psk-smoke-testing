require("../../psknode/bundles/testsRuntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");
require("callflow");

const path = require("path");
$$.securityContext = require("psk-security-context").createSecurityContext();
const edfsModule = require("edfs");
const HTTPBrickTransportStrategy = edfsModule.HTTPBrickTransportStrategy;
const brickTransportStrategyName = HTTPBrickTransportStrategy.prototype.HTTP_BRICK_TRANSPORT_STRATEGY;
const edfs = edfsModule.attach(brickTransportStrategyName);
const double_check = require("double-check");
const assert = double_check.assert;
const VirtualMQ = require("virtualmq");

function createServer(port, tempFolder, callback) {
    let server = VirtualMQ.createVirtualMQ(port, tempFolder, undefined, (err, res) => {
        if (err) {
            console.log("Failed to create VirtualMQ server on port ", port);
            console.log("Trying again...");
            if (port > 0 && port < 50000) {
                port++;
                createServer(callback);
            } else {
                console.log("about to throw error");
                throw err;
            }
        } else {
            console.log("Server ready and available on port ", port);
            let url = `http://127.0.0.1:${port}`;
            callback(undefined, server, url);
        }``
    });
}

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "ana are mere";
    assert.callback("TestRawCSB", (callback) => {
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.true(err === null || typeof err === "undefined", "Failed to generate identity from security context.");

            createServer(9097, path.join(testFolder,"tmp"), (err, server, url) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server");
                $$.brickTransportStrategiesRegistry.add(brickTransportStrategyName, new HTTPBrickTransportStrategy(url));

                edfs.createCSB((err, rawCSB) => {
                    if (err) {
                        throw err;
                    }
                    assert.true(err === null || typeof err === "undefined", "Failed to create CSB");

                    rawCSB.writeFile("a.txt", fileData, (err, barMapDigest) => {
                        assert.true(err === null || typeof err === "undefined", "Failed to write file in CSB");
                        assert.true(barMapDigest !== null && typeof barMapDigest !== "undefined", "Bar map digest is null or undefined");

                        edfs.loadCSB(rawCSB.getSeed(), (err, newRawCSB) => {
                            assert.true(err === null || typeof err === "undefined", "Failed to load CSB.");

                            newRawCSB.readFile("a.txt", (err, data) => {
                                assert.true(err === null || typeof err === "undefined", "Failed read file from CSB.");
                                assert.true(fileData === data.toString(), "Invalid read data");

                                server.close(err => {
                                    assert.true(err === null || typeof err === "undefined", "Failed to close server");

                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 3000);
});





