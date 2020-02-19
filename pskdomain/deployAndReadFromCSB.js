require('../../../psknode/bundles/testsRuntime');
require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/edfsBar');
require('../../../psknode/bundles/virtualMQ');

const tir = require("../../../psknode/tests/util/tir.js");
const assert = require('double-check').assert;

const domain = "local";

assert.callback("Deploy and read from CSB", (finished) => {

    tir.launch(6000, (err, vmqPort) => {
        assert.false(err, 'Failed launching TIR');

        const pskdomain = require('../../../modules/pskdomain');
        const vmqAddress = `http://127.0.0.1:${vmqPort}`;

        pskdomain.ensureEnvironmentIsReady(vmqAddress);
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.false(err, 'Could not generate identity');

            pskdomain.createConstitutionFromSources('../../../libraries/basicTestSwarms', (err, constitutionPath) => {
                assert.false(err, 'Failed creating constitution');

                pskdomain.deployConstitutionCSB(constitutionPath, (err, seedBuffer) => {
                    assert.false(err, 'Failed deploying constitution');

                    const seed = seedBuffer.toString();

                    pskdomain.getConstitutionFilesFromCSB(seed, (err, constitutionBundles) => {
                        assert.false(err, 'Failed getting constitution files from bar');
                        assert.equal(Object.keys(constitutionBundles).length, 1, 'Bar does not contain any files');

                        (function cleanupBuildsFolder() {
                            const fs = require('fs');
                            fs.rmdirSync('./builds', {recursive: true});
                        })();

                        finished();
                        tir.tearDown(0);
                    })
                })
            });
        });
    });
}, 6000);


