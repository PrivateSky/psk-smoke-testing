require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");
require("../../psknode/bundles/edfsBar");

const EDFS = require("edfs");
const createEDFSBrickStorage = require("edfs-brick-storage").create;
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
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
        }
    });
}

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "ana are mere";
    const brickTransportStrategyName = "http";
    $$.brickTransportStrategiesRegistry.add(brickTransportStrategyName, new EDFS.HTTPBrickTransportStrategy("http://localhost:9097"));
    const edfs = EDFS.attach(brickTransportStrategyName);
    assert.callback("TestRawCSB", (callback) => {
        createServer(9097, "tmp", (err, server) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            const bar = edfs.createBar();

            bar.writeFile("a.txt", fileData, (err, barMapDigest) => {
                if (err) {
                    throw err;
                }
                assert.true(err === null || typeof err === "undefined", "Failed to write file in CSB");
                assert.true(barMapDigest !== null && typeof barMapDigest !== "undefined", "Bar map digest is null or undefined");

                const newBar = edfs.loadBar(bar.getSeed());
                newBar.readFile("a.txt", (err, data) => {
                    assert.true(err === null || typeof err === "undefined", "Failed read file from CSB.");
                    assert.true(fileData === data.toString(), "Invalid read data");

                    server.close(err => {
                        assert.true(err === null || typeof err === "undefined", "Failed to close server");

                        callback();
                    });
                });
            });
        });
    }, 2000);
});


