require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("mount - trying to mount into an existing mounting point path", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);

        edfs.createRawDossier((err, rawDossier) => {
            if (err) {
                throw err;
            }

            edfs.createRawDossier((err, dossier1) => {
                if (err) {
                    throw err;
                }

                rawDossier.mount('/dossier1', dossier1.getSeed(), (err) => {
                    if (err) {
                        throw err;
                    }

                    edfs.createRawDossier((err, dossier2) => {
                        if (err) {
                            throw err;
                        }

                        rawDossier.mount('/dossier1/dossier2', dossier2.getSeed(), (err) => {
                            if (err) {
                                assert.true(err && err.message === 'Mount not allowed. Already exist a mount for /dossier1');
                                return testFinishCallback();
                            }

                            // The test stops in the above error because /dossier1 already is inside the mounting points of the rawDossier.
                            // I want to have dossier2 mounted into dossier1 using the above behaviour, not by using the inner dossier (dossier1) like on the current implemented behaviour. 

                            // In the end I wish the following test to pass:

                            rawDossier.readDir('/', (err, content) => {
                                if (err) {
                                    throw err;
                                }

                                assert.true(content[1].path === '/dossier1');

                                rawDossier.readDir('/dossier1', (err, content) => {
                                    if (err) {
                                        throw err;
                                    }

                                    assert.true(content[1].path === '/dossier2');

                                    dossier1.readDir('/', (err, content) => {
                                        if (err) {
                                            throw err;
                                        }

                                        assert.true(content[1].path === '/dossier2');
                                        testFinishCallback();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}, 5000);