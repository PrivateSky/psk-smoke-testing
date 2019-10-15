require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/psknode");
require("../../psknode/bundles/virtualMQ");

const bm = require("blockchain");
const bar = require("bar");
require("edfs-brick-storage");
const ArchiveConfigurator = bar.ArchiveConfigurator;
const Archive = bar.Archive;
const double_check = require("../../modules/double-check");
const assert = double_check.assert;
const VirtualMQ = require("virtualmq");
const crypto = require("crypto");

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

const agentAlias = "Smoky";

let PORT = 9090;
const tempFolder = "../../tmp";

$$.flows.describe("BarClone", {
    start: function (callback) {
        this.callback = callback;
        this.createServer((err, server, url) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server.");

            this.server = server;
            this.url = url;
            this.createArchive();
        });
    },

    createServer: function (callback) {
        let server = VirtualMQ.createVirtualMQ(PORT, tempFolder, undefined, (err, res) => {
            if (err) {
                console.log("Failed to create VirtualMQ server on port ", PORT);
                console.log("Trying again...");
                if (PORT > 0 && PORT < 50000) {
                    PORT++;
                    this.createServer(callback);
                } else {
                    console.log("about to throw error");
                    throw err;
                }
            } else {
                console.log("Server ready and available on port ", PORT);
                let url = `http://127.0.0.1:${PORT}`;
                callback(undefined, server, url);
            }
        });
    },

    createArchive: function () {
        this.archiveConfigurator = new ArchiveConfigurator();
        this.archiveConfigurator.setStorageProvider("EDFSBrickStorage", this.url);
        this.archiveConfigurator.setFsAdapter("FsAdapter");
        this.archiveConfigurator.setBufferSize(2);
        this.archiveConfigurator.setMapEncryptionKey(crypto.randomBytes(32));
        this.archive = new Archive(this.archiveConfigurator);

        this.createBlockchain((err, blockchain1) => {
            assert.true(!err, "Failed to create blockchain");

            blockchain1.startTransactionAs("agent", "Constitution", "addAgent", agentAlias, "PublicKey");
            this.createBlockchain((err, blockchain2) => {
                assert.true(!err, "Failed to create blockchain");

                let agent = blockchain2.lookup("Agent", agentAlias);
                assert.equal(agent, null);
                agent = blockchain1.lookup("Agent", agentAlias);
                assert.equal(agent.publicKey, "PublicKey");
                this.callback();
            });
        });
    },

    createBlockchain: function (onResult) {
        let worldStateCache = bm.createWorldStateCache("memory");
        let historyStorage = bm.createHistoryStorage("bar", this.archive);
        let consensusAlgorithm = bm.createConsensusAlgorithm("direct");
        let signatureProvider = bm.createSignatureProvider("permissive");
        let blockchain = bm.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider);
        blockchain.start(onResult)
    }
});

assert.callback("Bar clone test", (callback) => {
    $$.flows.start("BarClone", "start", callback);
}, 2000);