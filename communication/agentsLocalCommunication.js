const tir = require('../../../psknode/tests/util/tir');
const assert = require('../../../modules/double-check').assert;
const utils = require('./testUtils');

const intervalSize = 6000;
const noOfDomains = 1;
const noOfAgentsPerDomain = 2;

const swarms = {
  echo: {
    say: function(input) {
      this.return(Number(input) + 1);
    }
  }
};

utils.initData(intervalSize, noOfDomains, noOfAgentsPerDomain, swarms);
var interactions = utils.interactions;
assert.callback(
  `Doi agenti pot comunica in interiorul aceluiasi domain.`,
  finished => {
    tir.launch(intervalSize + intervalSize * 0.3, () => {
      let passedVariable = 0;

      for (let d = 0; d < utils.deployedDomains; d++) {
        utils.setupInteractions(d, noOfAgentsPerDomain);
      }

      const interactAgent1 = interactions[0][0];
      const interactAgent2 = interactions[0][1];
      setTimeout(() => {
        console.log('Swarm Started');
        interactAgent1.startSwarm('echo', 'say', passedVariable).onReturn(result => {
          interactAgent2.startSwarm('echo', 'say', result).onReturn(result => {
            passedVariable = result;
            assert.true(passedVariable === noOfAgentsPerDomain, `Agentii au comunicat!`);
            finished();
            tir.tearDown(0);
          });
        });
      }, 0);
    });
  },
  intervalSize + intervalSize * 0.4
);
