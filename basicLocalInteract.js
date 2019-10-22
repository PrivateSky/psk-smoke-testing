const tir = require('../../psknode/tests/util/tir');
const assert = require('../../modules/double-check').assert;

const domain = 'local';
const agent = 'exampleAgent';
const agents = [agent];

const swarm = {
  echo: {
    say: function(input) {
      this.return('Echo ' + input);
    }
  }
};

assert.callback('Basic Local interact test', (finished) => {
  tir.addDomain(domain, agents, swarm);

  tir.launch(3000, () => {
    tir.interact(domain, agent).startSwarm("echo", "say", "Hello").onReturn(result => {
        assert.equal("Echo Hello", result);
        finished();
        tir.tearDown(0);
    });
  });
}, 4000);
