require('../../../../psknode/bundles/testsRuntime');

const tir = require('../../../../psknode/tests/util/tir');
const assert = require('double-check').assert;

assert.callback('Bricking test (GET, PUT bricks)', (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }
        const openDSU = require('opendsu');
        const bricking = openDSU.loadApi('bricking');
        const keyssi = openDSU.loadApi('keyssi');
        const crypto = openDSU.loadApi('crypto');

        assert.true(typeof bricking.getBrick === 'function');
        assert.true(typeof bricking.putBrick === 'function');
        assert.true(typeof bricking.getMultipleBricks === 'function');

        const seedSSI = keyssi.buildSeedSSI('default', 'some string', 'control', 'v0', 'hint');
        const brickData = 'some data';

        bricking.putBrick(seedSSI, brickData, null, (err, brickHash) => {
            if (err) {
                throw err;
            }

            crypto.hash(seedSSI, brickData, (err, hash) => {
                if (err) {
                    throw err;
                }

                assert.true(brickHash === hash);

                const haskLinkSSI = keyssi.buildHashLinkSSI('default', brickHash);

                bricking.getBrick(haskLinkSSI, null, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(data.toString() === brickData);

                    bricking.getMultipleBricks([haskLinkSSI], null, (err, data) => {
                        if (err) {
                            throw err;
                        }

                        assert.true(data.toString() === brickData);
                        callback();
                    });
                });
            });
        });
    });
}, 10000);