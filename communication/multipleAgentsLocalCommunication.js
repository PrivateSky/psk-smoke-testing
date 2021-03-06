require("../../../psknode/bundles/testsRuntime");

const tir = require('../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const testUtils = require('./testUtils');

const args = process.argv.slice(2);
const intervalSize = 30000;
const noOfDomains = 1;
const noOfAgentsPerDomain = args[0] || 20;
const agentThrowingErrorIndex = args[1] || 300;

testUtils.initData(noOfDomains, noOfAgentsPerDomain, "./constitution");

assert.callback(
    ` Test that a number of ${noOfAgentsPerDomain} agents can exchange swarms inside a domain.`,
    finished => {
        tir.launch(
            intervalSize + intervalSize * 0.3,
            () => {
                let communicationWorking = 0;
                let swarmCounter = 0;

                function getResult() {
                    swarmCounter++;
                }

                let intervalHandler = setInterval(() => {
                    console.log(`communicationWorking ${communicationWorking} swarms:${swarmCounter} noAgentsPerDomain: ${noOfAgentsPerDomain}`);
                    if (communicationWorking === noOfAgentsPerDomain - 1) {
                        console.log(`SWARMS STARTED ${swarmCounter}`);
                        assert.true(
                            communicationWorking === noOfAgentsPerDomain - 1,
                            `There was issues exchanging swarms!`
                        );
                        clearInterval(intervalHandler);
                        finished();
                    }
                }, 500);

                for (let i = 0; i < noOfAgentsPerDomain - 1; i++) {
                    console.log(`Test communication between pskAgent_${i} and pskAgent_${i + 1}`);
                    const nextAgent = testUtils.constructFullAgentName(noOfDomains-1,i + 1);
                    const currentAgent = testUtils.constructFullAgentName(noOfDomains-1, i);

                    if (i + 1 === parseInt(agentThrowingErrorIndex, 10)) {
                        console.log('throwing Error');
                        $$.interaction
                            .startSwarmAs(nextAgent, 'commTest', 'default', nextAgent, '#1')
                            .onReturn(result => {
                                getResult();
                                communicationWorking += 1;
                            });
                    } else {
                        $$.interactions.startSwarmAs(currentAgent, 'commTest', 'default', nextAgent, 0).onReturn(result => {
                            getResult();
                            if (result === 2) {
                                communicationWorking += 1;
                            }
                        });
                    }
                }
            }
        );
    },
    intervalSize + intervalSize * 0.4
);
