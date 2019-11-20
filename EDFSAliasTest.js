require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/psknode");
require("../../psknode/bundles/virtualMQ");
require("psk-http-client");
require("edfs-brick-storage");
const VirtualMQ = require("virtualmq");
const path = require("path");
const double_check = require("../../modules/double-check");
const assert = double_check.assert;
let PORT = 9090;


function EDFS(url) {
    this.attachAlias = (fileName, alias, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/addAlias/" + fileName, alias, callback);
    };

    this.writeToAlias = (alias, data, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/alias/" + alias, data, callback);
    };

    this.readFromAlias = (alias, callback) => {
        $$.remote.doHttpGet(url + "/EDFS/alias/" + alias, callback);
    };

    this.writeFile = (fileName, data, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/" + fileName, data, callback);
    };

    this.readFile = (fileName, callback) => {
        $$.remote.doHttpGet(url + "/EDFS/" + fileName, callback);
    };
}

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
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder.");

    assert.callback("EDFSAliasTest", (callback) => {

        createServer(PORT, path.join(testFolder, "tmp"),(err, server, url) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");
            const edfs = new EDFS(url);
            const initialData = "first text";
            const addData = "second text";
            const alias = "testAlias";
            let fileName = "file11";

            edfs.writeFile(fileName, initialData, (err) => {
                assert.true(err === null || typeof err === "undefined", "Failed to write file.");

                edfs.attachAlias(fileName, alias, (err) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to attach alias.");

                    edfs.readFromAlias(alias, (err, readData) => {
                        assert.true(err === null || typeof err === "undefined", "Failed to read data from alias");

                        assert.equal(initialData, readData.toString(), "Unexpected data");

                        fileName = "file12";
                        edfs.attachAlias(fileName, alias, (err) => {
                            assert.true(err === null || typeof err === "undefined", "Failed to attach alias to file");

                            edfs.writeToAlias(alias, addData, (err) => {
                                assert.true(err === null || typeof err === "undefined", "Failed to write data to alias");

                                edfs.readFromAlias(alias, (err, buffer) => {
                                    assert.true(err === null || typeof err === "undefined", "Failed read from alias");

                                    assert.equal(addData, buffer.toString(), "Unexpected read data");

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
        });
    }, 1000);
});


