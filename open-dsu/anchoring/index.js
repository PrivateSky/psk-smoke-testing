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

            anchoring.addVersion(seedSSI, haskLinkSSI, null, 'zkp', 'digitalProoff', (err, data) => {
                if (err) {
                    throw err;
                }

                assert.true(true);

                anchoring.versions(seedSSI, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(Array.isArray(data));
                    assert.true(data.length === 1);
                    assert.true(data[0] === haskLinkSSI.getIdentifier());

                    anchoring.addVersion(seedSSI, haskLinkSSI, null, 'zkp', 'digitalProoff', (err) => {
                        if (err) {
                            assert.true(err.statusCode === 428);
                            assert.true(err.message === 'Unable to add alias: versions out of sync');
                        }
                    });

                    const secondBrickData = 'some data2 successs';
                   
                    crypto.hash(seedSSI, secondBrickData, (err, secondHash) => {
                        if (err) {
                            throw err;
                        }

                        const secondHaskLinkSSI = keyssi.buildHashLinkSSI('default', undefined, secondHash);

                        anchoring.addVersion(seedSSI, secondHaskLinkSSI, haskLinkSSI, 'zkp', 'digitalProoff', (err, data) => {
                            if (err) {
                                throw err;
                            }

                            assert.true(true);

                            anchoring.versions(seedSSI, (err, data) => {
                                if (err) {
                                    throw err;
                                }
                            
                                assert.true(Array.isArray(data));
                                assert.true(data.length === 2);
                                assert.true(data[0] === haskLinkSSI.getIdentifier());
                                assert.true(data[1] === secondHaskLinkSSI.getIdentifier());
                                callback();
                            })
                        })
                    });
                });
            });
        });
    })
}, 10000);
