const tir = require('./../../../psknode/tests/util/tir');
const assert = require('../../../modules/double-check').assert;
const domain = 'local';
const agentOne = 'firstAgent';
const agentTwo = 'secondAgent';
const agents = [agentOne, agentTwo];

const swarm = {
	contoller: {
		public: {
			resultValue: 'array',
		},
		serialExec: function(input) {
			this.resultValue = ['a'];

			var serial = this.serial(this.result);
			serial.swarmFirstInit(this.progress);
			serial.swarmSecondInit(this.progress);
		},
		swarmFirstInit: () => {
			// console.log('SWARM INIT  =====FIRST=====');

			assert.callback(
				'onReturn return time exceeded',
				function() {
					$$.swarm.start('first', 'say', '').onReturn(function(val) {
						// this.resultValue.push(val);
						this.resultValue.push('b');
					});
				},
				500
			);
		},
		swarmSecondInit: () => {
			// console.log('SWARM INIT  =====SECOND=====');
			assert.callback(
				'onReturn return time exceeded',
				function() {
					$$.swarm.start('second', 'say', '').onReturn(function(val) {
						// this.resultValue.push(val);
						this.resultValue.push('c');
					});
				},
				500
			);
		},
		progress: (error, progress) => {
			assert.true(typeof error !== 'undefined', 'Received error at executing ');
		},
		result: function(err, result) {
			this.return(this.resultValue);
		},
	},
	first: {
		say: function(value) {
			console.log('SWARM EXECUTED  =====FIRST=====');
			this.return('first');
		},
	},
	second: {
		say: function(value) {
			console.log('SECOND EXECUTED  =====SECOND=====');
			this.return('second');
		},
	},
};

assert.callback(
	'Local connection testing',
	finished => {
		tir.addDomain(domain, agents, swarm);

		tir.launch(5000, () => {
			tir.interact(domain, agentOne)
				.startSwarm('contoller', 'serialExec', agentOne)
				.onReturn(result => {
					assert.true(result.join('') === 'abc');
				});
		});
		finished();
		tir.tearDown(0);
	},
	3500
);
