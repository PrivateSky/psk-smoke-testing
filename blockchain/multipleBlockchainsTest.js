const assert = require('../../../modules/double-check').assert;
require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/psknode');

const bm = require('blockchain');

require('../../../modules/blockchain/tests/testUtil/simplestConstitution');

const agentAlias = "Smoky";
assert.begin("Running simple smoke test for PSK blockchain ")


function createBlockchain(onResult) {
    let worldStateCache = bm.createWorldStateCache("memory");
    let historyStorage = bm.createHistoryStorage("memory");
    let consensusAlgorithm = bm.createConsensusAlgorithm("direct");
    let signatureProvider = bm.createSignatureProvider("permissive");
    let blockchain = bm.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider);
    blockchain.start(onResult)
}

assert.callback("PK values should be persisted", function (done) {
    createBlockchain(function (err, blockchain1) {
        blockchain1.startTransactionAs("agent", "Constitution", "addAgent", agentAlias, "PublicKey");
        createBlockchain(function (err, blockchain2) {
            let agent = blockchain2.lookup("Agent", agentAlias);
            assert.equal(agent, null);
            agent = blockchain1.lookup("Agent", agentAlias);
            assert.equal(agent.publicKey, "PublicKey");
            done();
        });
    });
});


