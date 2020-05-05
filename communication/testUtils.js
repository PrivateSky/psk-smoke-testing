require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require('../../../psknode/bundles/pskWebServer');

const tir = require('../../../psknode/tests/util/tir');

exports.noOfDomains;
exports.noOfAgentsPerDomain;
exports.deployedDomains = 0;
exports.domainNameBase = 'pskDomain';
exports.agentNameBase = 'pskAgent';

// ----------------- domain and agents setup ------------------------

module.exports.constructDomainName = function(sufix) {
  return `${this.domainNameBase}_${sufix}`;
};

module.exports.constructAgentName = function(sufix) {
  return `${this.agentNameBase}_${sufix}`;
};

module.exports.constructFullAgentName = function(domaiSufix, agentSufix) {
  return `${module.exports.constructDomainName(domaiSufix)}/agent/${module.exports.constructAgentName(agentSufix)}`
};

module.exports.setupDomain = function(noOfAgents) {
  var agents = [];

  while (noOfAgents > 0) {
    noOfAgents--;
    agents.push(this.constructAgentName(agents.length));
  }

  tir.addDomain(this.constructDomainName(this.deployedDomains), agents, this.swarms);
  this.deployedDomains++;
};
//--------------------------------------------------------------------

module.exports.initDefaults = function(swarms) {
  this.initData(60000, 1, 1, swarms);
};

module.exports.initData = function(noOfDomains, noOfAgentsPerDomain, swarms) {
  this.noOfDomains = noOfDomains;
  this.noOfAgentsPerDomain = noOfAgentsPerDomain;
  this.swarms = swarms;
  for (let i = 0; i < noOfDomains; i++) {
    this.setupDomain(noOfAgentsPerDomain);
  }
};
