require('../../../../psknode/bundles/testsRuntime');

const tir = require('../../../../psknode/tests/util/tir');
const double_check = require("double-check");
const assert = double_check.assert;

assert.callback('Bricking test (GET, PUT bricks)', (callback) => {
    double_check.createTestFolder('AddFilesBatch', async (err, folder) => {
        tir.launchApiHubTestNode(100, folder, async err => {
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

            const seedSSI = keyssi.createTemplateSeedSSI('default', 'some string', 'control', 'v0', 'hint');
            const brickData = 'some data';

            bricking.putBrick('default', brickData, null, (err, brickHash) => {
                if (err) {
                    throw err;
                }

                const hashFn = crypto.getCryptoFunctionForKeySSI(seedSSI, "hash");
                const hash = hashFn(brickData);

                assert.true(brickHash === hash);

                const hashLinkSSI = keyssi.createHashLinkSSI('default', brickHash);

                bricking.getBrick(hashLinkSSI, null, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(data.toString() === brickData);

                    bricking.getMultipleBricks([hashLinkSSI], null, (err, data) => {
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
