require('../../../../psknode/bundles/testsRuntime');
require('../../../../psknode/bundles/openDSU');

const tir = require('../../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const openDSU = require('open-dsu');
const anchoring = openDSU.loadApi('anchoring');
const keyssi = openDSU.loadApi('keyssi');
const crypto = openDSU.loadApi('crypto');

assert.callback('Anchoring tests (GET, PUT anchor version)', (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }

        assert.true(typeof anchoring.versions === 'function');
        assert.true(typeof anchoring.addVersion === 'function');
        // assert.true(typeof bricking.getObservable === 'function');

        const seedSSI = keyssi.buildSeedSSI('default', undefined, 'some string', 'control', 'v0', 'hint');
        const brickData = 'some data';

        crypto.hash(seedSSI, brickData, (err, hash) => {
            if (err) {
                throw err;
            }

            const haskLinkSSI = keyssi.buildHashLinkSSI('default', undefined, hash);

            anchoring.addVersion(seedSSI, haskLinkSSI, (err, data) => {
                if (err) {
                    throw err;
                }

                assert.true(true);

                anchoring.versions(seedSSI, (err, data) => {
                    if (err) {
                        console.log(err)
                        throw err;
                    }

                    assert.true(Array.isArray(data));

                    callback();
                });

            });
        });
    })
}, 10000);