require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/psknode');
require('../../../psknode/bundles/edfsBar');
require('../../../psknode/bundles/virtualMQ');

const tir = require("../../../psknode/tests/util/tir.js");
const assert = require('../../../modules/double-check').assert;

const domain = "local";

assert.callback("Basic Test", (finished) => {
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"]);

    tir.launch(59000, (err, vmqPort) => {
        assert.false(err, 'Failed launching TIR');

        const pskadmin = require('../../../modules/pskadmin');
        const vmqAddress = `http://127.0.0.1:${vmqPort}`;

        pskadmin.ensureEnvironmentIsReady(vmqAddress);
        $$.securityContext.generateIdentity((err, agentId) => {
            assert.false(err, 'Could not generate identity');

            pskadmin.createConstitutionFromSources('../../../libraries/basicTestSwarms', (err, constitutionPath) => {
                assert.false(err, 'Failed creating constitution');

                pskadmin.deployConstitutionCSB(constitutionPath, (err, seedBuffer) => {
                    assert.false(err, 'Failed deploying constitution' + err);

                    const seed = seedBuffer.toString();

                    pskadmin.loadCSB(seed, (err, csb) => {
                        if (err) {
                            throw err;
                        }

                        createSomeDomains(csb, (err) => {
                            if (err) throw err;

                            checkEnoughBlocks(csb, () => {
                                finished();
                                tir.tearDown(0);
                            })

                        })
                    })

                })
            });
        });
    });


    function createSomeDomains(csb, callback) {
        const numberOfDomains = 10;
        let commitsLeft = numberOfDomains;

        for (let i = 0; i < numberOfDomains; i++) {
            csb.startTransactionAs('secretAgent', 'Domain', 'add', 'domain' + i, 'system', '.', 'notRandomSeed')
                .onCommit(checkAllCommitted);

        }

        function checkAllCommitted(err) {
            if (err) {
                commitsLeft = -1;
                return callback(err);
            }

            commitsLeft -= 1;

            if (commitsLeft === 0) {
                callback();
            }
        }
    }

    function checkEnoughBlocks(csb, callback) {
        csb.listFiles('blocks', (err, files) => {
            assert.false(err, 'Could not list files from csb');
            assert.equal(files.length, 13, 'Not all blocks were written');

            callback();
        });
    }
}, 60000);


