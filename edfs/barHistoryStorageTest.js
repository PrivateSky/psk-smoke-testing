require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/edfsBar");

const bm = require("blockchain");
const bar = require('bar');
const EDFS = require('edfs');
const EDFSBrickStorage = require("edfs-brick-storage");
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const double_check = require("double-check");
const assert = double_check.assert;
const ArchiveConfigurator = bar.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", EDFSBrickStorage.create);

$$.asset.describe("Agent", {
    public: {
        alias: "string:key",
        publicKey: "string"
    },
    init: function (alias, value) {
        this.alias = alias;
        this.publicKey = value;
    },
    ctor: function () {
        this.securityParadigm.constitutional();
    }
});

$$.transaction.describe("Constitution", {
    addAgent: function (alias, publicKey) {
        console.log("Adding Agent:", alias, publicKey);
        let agent = this.transaction.createAsset("Agent", "init", alias, publicKey);
        //this.transaction.add(agent);
        this.commit();
    },
    updatePublicKey: function (alias, publicKey) {
        let agent = this.transaction.lookup("Agent", alias);
        agent.publicKey = publicKey;
        this.transaction.add(agent);
        this.transaction.commit();
        console.log("Updating Agent:", alias, "PublicKey:", publicKey);
    }
});

const tir = require("../../../psknode/tests/util/tir");
const agentAlias = "Smoky";

$$.flows.describe("BarStorage", {
    start: function (callback) {
        this.callback = callback;
        tir.launchVirtualMQNode((err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            this.port = port;
            this.createArchive();
        });
    },

    createArchive: function () {
        const endpoint = `http://localhost:${this.port}`;
        const transportStrategy = new EDFS.HTTPBrickTransportStrategy(endpoint);
        const transportStrategyAlias = "justAnAlias";
        $$.brickTransportStrategiesRegistry.add(transportStrategyAlias, transportStrategy);

        this.archiveConfigurator = new ArchiveConfigurator();
        this.archiveConfigurator.setStorageProvider("EDFSBrickStorage", transportStrategy);
        this.archiveConfigurator.setSeedEndpoint(endpoint);
        this.archiveConfigurator.setFsAdapter("FsAdapter");
        this.archiveConfigurator.setBufferSize(65535);
        this.archive = bar.createArchive(this.archiveConfigurator);

        this.createBlockchain((err, blockchain1) => {
            assert.true(!err, "Failed to create blockchain");

            blockchain1.startTransactionAs("agent", "Constitution", "addAgent", agentAlias, "PublicKey");
            const agent = blockchain1.lookup("Agent", agentAlias);
            assert.equal(agent.publicKey, "PublicKey");
            this.callback();
        });
    },

    createBlockchain: function (onResult) {
        let worldStateCache = bm.createWorldStateCache("memory");
        let historyStorage = bm.createHistoryStorage("bar", this.archive);
        let consensusAlgorithm = bm.createConsensusAlgorithm("direct");
        let signatureProvider = bm.createSignatureProvider("permissive");
        let blockchain = bm.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider);
        blockchain.start(onResult);
    }
});

assert.callback("Bar history storage test", (callback) => {
    $$.flows.start("BarStorage", "start", callback);
}, 2000);