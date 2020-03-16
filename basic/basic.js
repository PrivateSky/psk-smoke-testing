require('../../../psknode/bundles/testsRuntime');
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");


const tir = require("../../../psknode/tests/util/tir.js");
const assert = require('double-check').assert;

const domain = "local";
const constitution = "./constitution";

assert.callback("Basic Test", (finished) => {
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"], constitution);

    tir.launch(6000, () => {
        $$.interactions.startSwarmAs(`${domain}/agent/system`, "echo", "say", "Hello")
            .onReturn((err, result) => {
                 assert.equal("Echo Hello", result);
                 finished();
            })
    });
}, 10000);