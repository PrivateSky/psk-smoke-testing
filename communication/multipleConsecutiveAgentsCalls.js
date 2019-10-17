const tir = require('../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const utils = require('./testUtils');

const args = process.argv.slice(2);
const intervalSize = 6000;
const noOfDomains = 1;
const noOfAgentsPerDomain = args[0] || 2;
const agentThrowingErrorIndex = args[1] || 300;

const swarms = {
  echo: {
    say: function(input) {
      console.log(`YELL ${input}`);
      this.return(Number(input) + 1);
    },
    throwError: function(delay) {
      console.log('An test purpose error will be thrown in ', delay || 10, 'ms');
      setTimeout(() => {
        throw new Error('this is a generated error for testing purpose');
      }, delay || 10);
    }
  }
};

utils.initData(intervalSize, noOfDomains, noOfAgentsPerDomain, swarms);
var interactions = utils.interactions;
assert.callback(
  `Se pot realiza call-uri succesive din agenti diferiti.`,
  finished => {
    tir.launch(intervalSize + intervalSize * 0.3, () => {
      var communicationWorking = 0;
      var swarmCounter = 0;
      function getResult() {
        swarmCounter++;
      }
      for (let d = 0; d < utils.deployedDomains; d++) {
        utils.setupInteractions(d, utils.noOfAgentsPerDomain);
      }
      setInterval(() => {
        if (communicationWorking == noOfAgentsPerDomain - 1) {
          console.log(`SWARMS STARTED ${swarmCounter}`);
          assert.true(
            communicationWorking == noOfAgentsPerDomain - 1,
            `Au aparut probleme in pornirea unui swarm!`
          );
          finished();
          tir.tearDown(0);
        }
      }, 500);
      for (let i = 0; i < interactions[0].length - 1; i++) {
        console.log(`Test communication between pskAgent_${i} and pskAgent_${i + 1}`);
        interactions[0][i].startSwarm('echo', 'say', 0).onReturn(result => {
          if (i + 1 == agentThrowingErrorIndex) {
            interactions[0][i + 1].startSwarm('echo', 'throwError', result).onReturn(result1 => {
              getResult();
            });
          } else {
            interactions[0][i + 1].startSwarm('echo', 'say', result).onReturn(result1 => {
              getResult();
              if (result1 == 2) {
                communicationWorking += 1;
              }
            });
          }
        });
      }
    });
  },
  intervalSize + intervalSize * 0.4
);
