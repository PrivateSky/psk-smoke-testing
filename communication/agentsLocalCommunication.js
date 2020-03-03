require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require('../../../psknode/bundles/virtualMQ');

const tir = require('../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const utils = require('./testUtils');

const intervalSize = 6000;
const domainName = 'local';
const noOfAgentsPerDomain = 2;
function getAgentName(index){
    return 'system' + index;
}
const agents = [...Array(noOfAgentsPerDomain).keys()].map(getAgentName);

tir.addDomain(domainName, agents, "./constitution");

assert.callback(
    `Doi agenti pot comunica in interiorul aceluiasi domain.`,
    finished => {
        tir.launch(intervalSize + intervalSize * 0.3, () => {
            let passedVariable = 0;

            $$.interaction.startSwarmAs(`${domainName}/agent/${getAgentName(0)}`, 'echo', 'say', passedVariable).onReturn((err, result) => {
                assert.false(err, 'Should not have an error running as agent "system0"');
                $$.interaction.startSwarmAs(`${domainName}/agent/${getAgentName(1)}`, 'echo', 'say', result).onReturn((err, result) => {
                    assert.false(err, 'Should not have an error running as agent "system1" ');
                    assert.true(result === noOfAgentsPerDomain, `Agentii n-au comunicat!`);
                    finished();
                    tir.tearDown(0);
                });
            });

        });
    },
    intervalSize + intervalSize * 0.4
);
