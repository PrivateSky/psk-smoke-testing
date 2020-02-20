require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require('../../../psknode/bundles/virtualMQ');

const tir = require('../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const utils = require('./testUtils');

const args = process.argv.slice(2);
const intervalSize = 6000;
const noOfDomains = 1;
const noOfAgentsPerDomain = args[0] || 2;
const agentThrowingErrorIndex = args[1] || 300;

const swarms = {
    commTest: {
        default: function (agentName, input) {
            input += 1;
            this.swarm(agentName, 'extension', input);
        },
        extension: function (input) {
            if (input === '#1') {
                throw new Error('Intended error');
            } else {
                input += 1;
                this.return(input);
            }
        }
    }
};

utils.initData(intervalSize, noOfDomains, noOfAgentsPerDomain, swarms);
const interactions = utils.interactions;

assert.callback(
    `${noOfAgentsPerDomain} agenti pot comunica in interiorul aceluiasi domain.`,
    finished => {
        tir.launch(
            intervalSize + intervalSize * 0.3,
            () => {
                let communicationWorking = 0;
                let swarmCounter = 0;

                function getResult() {
                    swarmCounter++;
                }

                for (let d = 0; d < utils.deployedDomains; d++) {
                    utils.setupInteractions(d, noOfAgentsPerDomain);
                }

                setInterval(() => {
                    console.log(`communicationWorking ${communicationWorking} swarms:${swarmCounter}`);
                    if (communicationWorking === noOfAgentsPerDomain - 1) {
                        console.log(`SWARMS STARTED ${swarmCounter}`);
                        assert.true(
                            communicationWorking === noOfAgentsPerDomain - 1,
                            `Au aparut probleme in comunicare!`
                        );
                        finished();
                        tir.tearDown(0);
                    }
                }, 500);

                for (let i = 0; i < interactions[0].length - 1; i++) {
                    console.log(`Test communication between pskAgent_${i} and pskAgent_${i + 1}`);
                    const nextAgent = 'pskAgent_' + (i + 1);
                    if (i + 1 === agentThrowingErrorIndex) {
                        interactions[0][i]
                            .startSwarm('commTest', 'default', nextAgent, '#')
                            .onReturn(result => {
                                getResult();
                                if (result === 2) {
                                    communicationWorking += 1;
                                }
                            });
                    } else {
                        interactions[0][i].startSwarm('commTest', 'default', nextAgent, 0).onReturn(result => {
                            getResult();
                            if (result === 2) {
                                communicationWorking += 1;
                            }
                        });
                    }
                }
            },
            intervalSize + intervalSize * 0.4
        );
    },
    3000
);
