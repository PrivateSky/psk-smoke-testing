const DOMAIN_CONSTITUTION_FOLDER = "./leafletDossierType";
require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

const AGENT_IDENTITY = "did:example:123456789abcdefghi";

let dossierTypeScripts = [];

dossierTypeScripts.push("../../../psknode/bundles/" + "pskruntime.js");
dossierTypeScripts.push("../../../psknode/bundles/" + "blockchain.js");
//dossierTypeScripts.push("../../../psknode/bundles/" + "webshims.js");

function prepareCSB(endpoint, callback) {
    const EDFS = require("edfs");
    EDFS.createDSU("Bar", (err, bar) => {
        bar.addFiles(dossierTypeScripts, "/" + EDFS.constants.CSB.CODE_FOLDER + "/" + EDFS.constants.CSB.CONSTITUTION_FOLDER, (err) => {
            if (err) {
                throw err;
            }
            //bar.addFile...
            tir.buildConstitution(DOMAIN_CONSTITUTION_FOLDER, bar, (err) => {
                if (err) {
                    throw err;
                }
                callback(undefined, bar.getKeySSI());
            });
        });
    })

}

function loadCSBAndStartTesting(err, seed, testFinishCallback) {
    if (err) {
        throw err;
    }

    const dossier = require("dossier");
    dossier.load(seed, AGENT_IDENTITY, (err, csb) => {
        if (err) {
            throw err;
        }
        const productUID = 1234;
        const description = "simple description";
        csb.startTransaction("leaflets", "create", productUID, description).onReturn((err, res) => {
            assert.isNull(err, "transaction failed");
            assert.notNull(res);
            assert.equal(res.productUID, productUID);
            assert.equal(res.description, description);

            csb.startTransaction("leaflets", "create", "3124", "description").onReturn((err, res) => {
                assert.isNull(err, "transaction failed");
                assert.notNull(res);
                assert.equal(res.productUID, "3124");
                assert.equal(res.description, "description");

                const newDescription = "new description";
                csb.startTransaction("leaflets", "update", productUID, newDescription).onReturn((err, res)=>{
                    assert.isNull(err, "transaction failed");
                    assert.equal(res.productUID, productUID);
                    assert.equal(res.description, newDescription);

                    testFinishCallback();
                });
            });

        });
    });
}

assert.callback("Test Dossiers capabilities", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        $$.BDNS.addConfig("default", {
            endpoints: [
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'brickStorage'
                },
                {
                    endpoint:`http://localhost:${port}`,
                    type: 'anchorService'
                }
            ]
        })
        const EDFS_HOST = `http://localhost:${port}`;
        prepareCSB(EDFS_HOST, function(err,seed){
            loadCSBAndStartTesting(err,seed, testFinishCallback);
        });
    });
}, 5000);
