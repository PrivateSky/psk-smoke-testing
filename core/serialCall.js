require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require('./../../../psknode/tests/util/tir');
const assert = require('double-check').assert;
const domain = 'local';
const agentOne = 'firstAgent';
const agentTwo = 'secondAgent';
const agents = [agentOne, agentTwo];

const domainSource = "./serialCallSwarms";

assert.callback(
	'Local connection testing',
	finished => {
		tir.addDomain(domain, agents, domainSource);

		tir.launch(10000, () => {
			$$.interactions.startSwarmAs(`${domain}/agent/${agentOne}`, "controller", "serialExec", agentOne)
				.onReturn(function(err, result){
					console.log(result);
					assert.true(result.join('') === 'abc');
					finished();
				});
		});
	},
	7000
);
