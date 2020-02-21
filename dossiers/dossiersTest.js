const DOMAIN_CONSTITUTION_FOLDER = "./leafletDossierType";
require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

const AGENT_IDENTITY = "did:example:123456789abcdefghi";

let dossierTypeScripts = [];

dossierTypeScripts.push("../../../psknode/bundles/" + "pskruntime.js");
dossierTypeScripts.push("../../../psknode/bundles/" + "blockchain.js");
//dossierTypeScripts.push("../../../psknode/bundles/" + "webshims.js");

function prepareCSB(endpoint, callback) {
    const EDFS = require("edfs");
    let edfs = EDFS.attachToEndpoint(endpoint);
    let bar = edfs.createBar();

    bar.addFiles(dossierTypeScripts, EDFS.constants.CSB.CONSTITUTION_FOLDER, (err) => {
        if (err) {
            throw err;
        }
        console.log("Added files...")
        //bar.addFile...
        tir.buildConstitution(DOMAIN_CONSTITUTION_FOLDER, bar, (err) => {
            if (err) {
                throw err;
            }
            callback(undefined, bar.getSeed().toString());
        });
    });
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
            //... do asserts
            assert.isNull(err, "transaction failed");
            assert.notNull(res);
            console.log("One finished");
            const newDescription = "new description";
            csb.startTransaction("leaflets", "actualize", productUID, newDescription).onReturn((err, res)=>{
                assert.isNull(err, "transaction failed");
                testFinishCallback();
                tir.tearDown();
            });
        });
    });
}

assert.callback("Test Dossiers capabilities", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;
        prepareCSB(EDFS_HOST, function(err,seed){
            loadCSBAndStartTesting(err,seed, testFinishCallback);
        });
    });
}, 5000);