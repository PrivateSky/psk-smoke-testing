require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const EDFS = require("edfs");
const EDFSBrickStorage = require("edfs-brick-storage");
const barModule = require("bar");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir");

assert.callback("Get multiple bricks test", (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        assert.true(err === null || typeof err === "undefined", "Failed to create server.");
        const endpoint = `http://localhost:${port}`;
        const edfsBrickStorage = EDFSBrickStorage.createBrickStorageService(endpoint);

        let bricksData = ["first", "second", "third"];
        let bricksHashes = [];

        function putBricksRecursively(brickIndex, callback) {
            const brickData = bricksData[brickIndex];
            const brick = barModule.createBrick();
            brick.setTransformedData(brickData);
            bricksHashes.push(brick.getHash());
            brickIndex++;
            edfsBrickStorage.putBrick(brick, (err) => {
                if (err) {
                    return callback(err);
                }

                if (brickIndex === bricksData.length) {
                    callback();
                } else {
                    putBricksRecursively(brickIndex, callback);
                }
            });
        }


        putBricksRecursively(0, (err) => {
            if (err) {
                throw err;
            }

            edfsBrickStorage.getMultipleBricks(bricksHashes, (err, bricks) => {
                if (err) {
                    throw err;
                }

                const readBricksHashes = bricks.map(brick => brick.getHash());
                assert.arraysMatch(bricksHashes.sort(), readBricksHashes.sort(), "Failed at get multiple bricks");
                callback();
            });
        });
    });

}, 15000);

