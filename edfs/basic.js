const DOMAIN_CONSTITUTION_FOLDER = "./domain";
require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.begin("basic test for edfs", function(){
    //... do cleaning if necessary
}, 5000);

function prepareCSB(endpoint, callback){
    const EDFS = require("edfs");
    let edfs = EDFS.attachToEndpoint(endpoint);
    let bar = edfs.createBar();

    bar.addFolder("../../../psknode/bundles", EDFS.constants.CSB.CONSTITUTION_FOLDER, (err)=>{
        if(err){
            throw err;
        }

        //bar.addFile...

        tir.buildConstitution(DOMAIN_CONSTITUTION_FOLDER, bar, (err)=>{
            if(err){
                throw err;
            }
            callback(undefined, bar.getSeed());
        });
    });
}

function loadCSBAndStartTesting(err, seed){
    if(err){
        throw err;
    }
    assert.callback("Test EDFS capabilities", (testFinishCallback)=>{
        const dossier = require("dossier");
        dossier.load(seed, (err, csb)=>{
            if(err){
                throw err;
            }
            csb.startTransaction("transactionName", "phase").onReturn((err, res)=>{
                //... do asserts
                //assert.isNull(err, "swarm finished with errors");
                testFinishCallback();
                tir.tearDown();
            });
        });
    }, 10000);
}

tir.launchVirtualMQNode(function(err, port){
    if(err){
        throw err;
    }
    const EDFS_HOST = `http://localhost:${port}`;
    prepareCSB(EDFS_HOST, loadCSBAndStartTesting);
});