require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/virtualMQ');

const tir = require("../../../psknode/tests/util/tir.js");
const assert = require('../../../modules/double-check').assert;

const domain = "local";

assert.callback("Basic Test", (finished) => {
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"]);

    tir.launch(6000, (err, vmqPort) => {
        assert.false(err, 'Failed launching TIR');

        const pskadmin = require('../../../modules/pskadmin');

        pskadmin.ensureEnvironmentIsReady(`http://127.0.0.1:${vmqPort}`);

        pskadmin.createConstitutionFromSources('../../../libraries/basicTestSwarms', (err, constitutionPath) => {
            assert.false(err, 'Failed creating constitution');

            pskadmin.deployConstitutionBar(constitutionPath, (err, seedBuffer) => {
                assert.false(err, 'Failed deploying constitution');

                const seed = seedBuffer.toString();

                pskadmin.getConstitutionFilesFromBar(seed, (err, constitutionBundles) => {
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
}, 6000);


