require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("We should be able to get a seed of a bar before finish writing?", (testFinishCallback) => {
	tir.launchVirtualMQNode(function (err, port) {
		if (err) {
			throw err;
		}
		const EDFS_HOST = `http://localhost:${port}`;

		const EDFS = require("edfs");
		let edfs = EDFS.attachToEndpoint(EDFS_HOST);

		let raw_dossier = edfs.createCSB();
		raw_dossier.mount("/", "test", edfs.createCSB().getSeed(), (err)=>{
			assert.true(typeof err === "undefined");
			raw_dossier.writeFile("just_a_path", "some_content", 0,function(err){
				assert.true(typeof err === "undefined");
				let dossier = require("dossier");
				dossier.load(raw_dossier.getSeed(), "baubau", (err, handler)=>{
					if(err){
						throw err;
					}
					console.log("bau");
				});
			});
		});

	});
}, 5000);