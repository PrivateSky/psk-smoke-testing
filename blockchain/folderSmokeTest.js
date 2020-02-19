require('../../../psknode/bundles/testsRuntime');
require('../../../psknode/bundles/pskruntime');
require('callflow').initialise();

let doubleCheck = require('../../../modules/double-check');
const assert = doubleCheck.assert;
const bm = require('blockchain');

require('../../../modules/blockchain/tests/testUtil/simplestConstitution');

const tu = require('../../../modules/blockchain/tests/testUtil');
const storageFolder = "./__storageFolder";

doubleCheck.createTestFolder(storageFolder, mainTest);

assert.begin("Running folder persistence smoke test for PSK blockchain");

function mainTest(err, storageFolder) {

   // assert.disableCleanings(); //to debug it during development of the test

    let worldStateCache = bm.createWorldStateCache("fs", storageFolder);
    let historyStorage = bm.createHistoryStorage("fs", storageFolder);
    let consensusAlgorithm = bm.createConsensusAlgorithm("direct");
    let signatureProvider  =  bm.createSignatureProvider("permissive");


    bm.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider);

    const agentAlias = "Smoky";


    function restartBlockchainFromCache(done) {
        let worldStateCache = bm.createWorldStateCache("fs", storageFolder);
        let historyStorage = bm.createHistoryStorage("fs", storageFolder);
        let consensusAlgorithm = bm.createConsensusAlgorithm("direct");

        bm.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, false, true);
        $$.blockchain.start(function (err, res) {
            assert.false(err, 'Failed to start blockchain');
            let agent = $$.blockchain.lookup("Agent", agentAlias);
            $$.fixMe("If we uncomment the next line,it fails. investigate and fix this!");
            //$$.transactions.start("Constitution", "addAgent", agentAlias+"WithC", "withoutPK");
            assert.equal(agent.publicKey, "withoutPK");
            $$.blockchain.onceAllCommitted(() => {
                done();
            });
        })
    }

    function restartBlockchainWithoutCache(done) {
        let worldStateCache = bm.createWorldStateCache("none");
        let historyStorage = bm.createHistoryStorage("fs", storageFolder);
        let consensusAlgorithm = bm.createConsensusAlgorithm("direct");
        bm.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider,false, true);
        $$.blockchain.start(function (err, res) {
            $$.blockchain.startTransactionAs("agent","Constitution", "addAgent", agentAlias+"WithoutC", "withoutPK");
            $$.blockchain.onceAllCommitted(() => {

                let agent = $$.blockchain.lookup("Agent", agentAlias);
                assert.equal(agent.publicKey, "withoutPK");
                done();
            });
        })
    }

    assert.callback("PK values should be persisted", function (done) {
        $$.blockchain.start(function (err) {
            if(err) {
                throw err;
            }
            // assert.isNull(err, 'Failed to start blockchain');
            $$.blockchain.startTransactionAs("agent","Constitution", "addAgent", "superMan", "withoutPK");
            $$.blockchain.startTransactionAs("agent","Constitution", "addAgent", agentAlias, "withoutPK");
            $$.blockchain.startTransactionAs("agent","Constitution", "addAgent", agentAlias+"XXX", "withoutPK");

            $$.blockchain.onceAllCommitted(() => {
                restartBlockchainFromCache(() => {
                    restartBlockchainWithoutCache(done);
                });
            });
        });
    })
}

