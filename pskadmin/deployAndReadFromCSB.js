require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/psknode');
require('../../../psknode/bundles/edfsBar');
require('../../../psknode/bundles/virtualMQ');

const tir = require("../../../psknode/tests/util/tir.js");
const assert = require('../../../modules/double-check').assert;

const domain = "local";

assert.callback("Deploy and read from CSB", (finished) => {
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"]);

    tir.launch(6000, (err, vmqPort) => {
        assert.false(err, 'Failed launching TIR');

        const pskadmin = require('../../../modules/pskadmin');
        const vmqAddress = `http://127.0.0.1:${vmqPort}`;

        pskadmin.ensureEnvironmentIsReady(vmqAddress);
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.false(err, 'Could not generate identity');

            pskadmin.createConstitutionFromSources('../../../libraries/basicTestSwarms', (err, constitutionPath) => {
                assert.false(err, 'Failed creating constitution');

                pskadmin.deployConstitutionCSB(constitutionPath, (err, seedBuffer) => {
                    assert.false(err, 'Failed deploying constitution');

                    const seed = seedBuffer.toString();

                    pskadmin.getConstitutionFilesFromCSB(seed, (err, constitutionBundles) => {
                        assert.false(err, 'Failed getting constitution files from bar');
                        assert.equal(constitutionBundles.length, 1, 'Bar does not contain any files');

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


