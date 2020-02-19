const DOMAIN_CONSTITUTION_FOLDER = "./testConstitution";
require("../../../psknode/bundles/testsRuntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Test EDFS capabilities", (testFinishCallback) => {
    function prepareCSB(endpoint, callback) {
        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(endpoint);
        let bar = edfs.createBar();

        bar.addFolder("../../../psknode/bundles", EDFS.constants.CSB.CONSTITUTION_FOLDER, (err) => {
            if (err) {
                throw err;
            }

            //bar.addFile...
            tir.buildConstitution(DOMAIN_CONSTITUTION_FOLDER, bar, (err) => {
                if (err) {
                    throw err;
                }
                callback(undefined, bar.getSeed().toString());
            });
        });
    }

    function loadCSBAndStartTesting(err, seed) {
        if (err) {
            throw err;
        }

        const dossier = require("dossier");
        dossier.load(seed, "ceva", (err, csb) => {
            if (err) {
                throw err;
            }

            csb.startTransaction("echo", "say").onReturn((err, res) => {
                //... do asserts
                //assert.isNull(err, "swarm finished with errors");
                testFinishCallback();
                tir.tearDown();
            });
        });
    }

    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;
        prepareCSB(EDFS_HOST, loadCSBAndStartTesting);
    });

}, 10000);