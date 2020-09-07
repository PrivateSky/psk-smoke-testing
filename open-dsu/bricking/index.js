require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/openDSU");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;
const openDSU = require("open-dsu");
const bricking = openDSU.loadApi("bricking");
const keyssi = openDSU.loadApi("keyssi");
const crypto = openDSU.loadApi("crypto");

assert.callback("Get brick put brick", (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }

        const seedSSI = keyssi.buildSeedSSI("default", undefined, "some string", "control", "v0", "hint");
        const brickData = "some data";
        bricking.putBrick(seedSSI, brickData, (err, brickHash) => {
            if (err) {
                throw err;
            }

            brickHash = JSON.parse(brickHash).message;
            crypto.hash(seedSSI, brickData, (err, hash) => {
                if (err) {
                    throw err;
                }

                assert.true(brickHash === hash);
                const hlSSI = keyssi.buildHashLinkSSI("default", undefined, brickHash);
                bricking.getBrick(hlSSI, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(data.toString() === brickData);
                    callback();
                });
            });
        });
    });
}, 10000);