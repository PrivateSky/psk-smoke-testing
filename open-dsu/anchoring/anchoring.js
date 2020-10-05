require('../../../../psknode/bundles/testsRuntime');
require('../../../../psknode/bundles/openDSU');

const tir = require('../../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const openDSU = require('opendsu');
const anchoring = openDSU.loadApi('anchoring');
const keySSISpace = openDSU.loadApi('keyssi');
const bdns = openDSU.loadApi('bdns');
const crypto = openDSU.loadApi('crypto');

assert.callback('Anchoring tests (GET, PUT anchor version)', (callback) => {
    tir.launchVirtualMQNode((err, port) => {
        if (err) {
            throw err;
        }

        bdns.addRawInfo("default", {
            brickStorages: [`http://localhost:${port}`],
            anchoringServices: [`http://localhost:${port}`]
        })

        assert.true(typeof anchoring.versions === 'function');
        assert.true(typeof anchoring.addVersion === 'function');
        // assert.true(typeof bricking.getObservable === 'function');

        const seedSSI = keySSISpace.buildSeedSSI('default', 'some string', 'control', 'v0', 'hint');
        const brickData = 'some data';

        crypto.hash(seedSSI, brickData, (err, hash) => {
            if (err) {
                throw err;
            }

            const hashLinkSSI = keySSISpace.buildHashLinkSSI('default', hash);

            anchoring.addVersion(seedSSI, hashLinkSSI, undefined, 'zkp', 'digitalProof', (err, data) => {
                if (err) {
                    throw err;
                }

                anchoring.versions(seedSSI, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true(Array.isArray(data));
                    assert.true(data.length === 1);
                    assert.true(data[0].getIdentifier() === hashLinkSSI.getIdentifier());

                    anchoring.addVersion(seedSSI, hashLinkSSI, undefined, 'zkp', 'digitalProof', (err) => {
                        if (err) {
                            assert.true(err.statusCode === 428);
                            assert.true(err.message === 'Unable to add alias: versions out of sync');
                        }

                        const secondBrickData = 'some data2 successs';
                        crypto.hash(seedSSI, secondBrickData, (err, secondHash) => {
                            if (err) {
                                throw err;
                            }

                            const secondHaskLinkSSI = keySSISpace.buildHashLinkSSI('default', secondHash);

                            anchoring.addVersion(seedSSI, secondHaskLinkSSI, hashLinkSSI, 'zkp', 'digitalProoff', (err, data) => {
                                if (err) {
                                    throw err;
                                }


                                anchoring.versions(seedSSI, (err, data) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(Array.isArray(data));
                                    assert.true(data.length === 2);
                                    assert.true(data[0].getIdentifier() === hashLinkSSI.getIdentifier());
                                    assert.true(data[1].getIdentifier() === secondHaskLinkSSI.getIdentifier());
                                    callback();
                                })
                            })
                        });
                    });
                });
            });
        });
    })
}, 10000);
