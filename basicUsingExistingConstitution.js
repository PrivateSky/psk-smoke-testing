const path = require('path');
require('../../psknode/bundles/testsRuntime');
require("../../psknode/bundles/pskruntime");
require("../../psknode/bundles/virtualMQ");

const tir = require("../../psknode/tests/util/tir.js");
const assert = require('double-check').assert;

const domain = "local";

assert.callback("Basic Test", (finished) => {
    const constitutionPath = path.resolve(path.join(__dirname, '../../libraries/basicTestSwarms'));
    const localDomain = tir.addDomain(domain, ["system", "specialAgent"], constitutionPath);

    tir.launch(6000, () => {
        $$.interactions.startSwarmAs(`${domain}/agent/system`, "echo", "say", "Hello")
            .onReturn((err, result) => {
                assert.equal("Echo Hello", result);
                finished();
            })
    });
}, 6000);