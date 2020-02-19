require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");


const tir = require("../../psknode/tests/util/tir.js");
const assert = require('../../modules/double-check').assert;

const domain = "local";

assert.callback("Basic Test", (finished) => {
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"]);

    localDomain.swarms.describe("echo", {
        say: function (message) {
            this.return(null, 'Echo ' + message);
        }
    });

    tir.launch(6000, () => {
        $$.interactions.startSwarmAs(`${domain}/agent/system`, "echo", "say", "Hello")
            .onReturn((err, result) => {
                 assert.equal("Echo Hello", result);
                 finished();
                 tir.tearDown(0);
            })
    });
}, 6000);

