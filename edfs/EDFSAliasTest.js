require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");

const bar = require('bar');
const EDFSBrickStorage = require("edfs-brick-storage");
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const double_check = require("double-check");
const assert = double_check.assert;
const tir = require("../../../psknode/tests/util/tir");

const ArchiveConfigurator = bar.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", EDFSBrickStorage.create);

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder.");

    assert.callback("EDFSAliasTest", (callback) => {

        tir.launchVirtualMQNode(testFolder,(err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");
            const edfs = require("edfs-middleware").createEDFSClient(`http://localhost:${port}`);
            const initialData = "first text";
            const addData = "second text";
            const alias = "testAlias";
            let fileName = "file11";

            edfs.writeFile(fileName, initialData, (err) => {
                assert.true(err === null || typeof err === "undefined", "Failed to write file.");

                edfs.attachAlias(fileName, alias, (err) => {
                    assert.true(err === null || typeof err === "undefined", "Failed to attach alias.");

                    edfs.readFromAlias(alias, (err, readData) => {
                        //assert.disableCleanings();
                        assert.true(err === null || typeof err === "undefined", "Failed to read data from alias");

                        assert.equal(initialData, readData.toString(), "Unexpected data");

                        fileName = "file12";
                        edfs.attachAlias(fileName, alias, (err) => {
                            assert.true(err === null || typeof err === "undefined", "Failed to attach alias to file");

                            edfs.writeToAlias(alias, addData, (err) => {
                                assert.true(err === null || typeof err === "undefined", "Failed to write data to alias");

                                edfs.readFromAlias(alias, (err, buffer) => {
                                    if (err) {
                                        throw err;
                                    }
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


