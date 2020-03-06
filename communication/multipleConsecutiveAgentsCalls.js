require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require('../../../psknode/bundles/virtualMQ');

const tir = require('../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const testUtils = require('./testUtils');

const args = process.argv.slice(2);
const intervalSize = 10000;
const noOfDomains = 1;
const noOfAgentsPerDomain = args[0] || 2;
const agentThrowingErrorIndex = args[1] || 1;

testUtils.initData(noOfDomains, noOfAgentsPerDomain, "./constitution");

assert.callback(
    `Ability of an Agent to recover after an error throw`,
    finished => {
        tir.launch(intervalSize + intervalSize * 0.3, () => {
            var testLoopsCompleted = 0;
            var swarmCounter = 0;

            function getResult() {
                swarmCounter++;
            }

            setInterval(() => {
                console.log(`SWARM COUNTER: ${swarmCounter}`);
                console.log(`Finished test loops: ${testLoopsCompleted}`)
               /* assert.true(
                    testLoopsCompleted == noOfAgentsPerDomain,
                    `There were communication issues during swarm exchanging.!`
                );*/
                if (testLoopsCompleted == noOfAgentsPerDomain) {
                    finished();
                }
            }, 500);
            for (let i = 0; i < noOfAgentsPerDomain; i++) {
                let intermediaryResult = 0;
                if (i == agentThrowingErrorIndex) {
                    $$.interactions.startSwarmAs(testUtils.constructFullAgentName(noOfDomains - 1, i), 'echo', 'throwError', 0);
                    $$.interactions.startSwarmAs(testUtils.constructFullAgentName(noOfDomains - 1, i), 'echo', 'say', intermediaryResult).onReturn((err, result) => {
                        console.log("######", i, err, result);
                        if (i == agentThrowingErrorIndex && result == 1) {
                            testLoopsCompleted += 1;
                        }
                        getResult();
                    });
                } else {
                    $$.interactions.startSwarmAs(testUtils.constructFullAgentName(noOfDomains - 1, i), 'echo', 'say', 0).onReturn((err, result) => {
                        getResult();
                        $$.interactions.startSwarmAs(testUtils.constructFullAgentName(noOfDomains - 1, i), 'echo', 'say', result).onReturn((err, result) => {
                            getResult();
                            if (result == 2) {
                                testLoopsCompleted += 1;
                            }
                        });
                    });
                }
            }
        });
    },
    intervalSize + intervalSize * 0.4
);
