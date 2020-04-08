require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("Load a dossier that was a mount point to a dossier with constitution code.", (testFinishCallback) => {
	tir.launchVirtualMQNode(function (err, port) {
		if (err) {
			throw err;
		}
		const EDFS_HOST = `http://localhost:${port}`;

		const EDFS = require("edfs");
		let edfs = EDFS.attachToEndpoint(EDFS_HOST);
		let ref = edfs.createRawDossier();
		ref.addFolder("../../../../psknode/bundles", "/", (err) => {
			if (err) {
				throw err;
			}
			let raw_dossier = edfs.createRawDossier();

			const fileContent = "$$.transactions.describe('echo', {\n" +
				"\t\tsay: function (message) {\n" +
				"\t\t\tthis.return(undefined, message);\n" +
				"\t\t}\n" +
				"\t}\n" +
				");";
			ref.writeFile("domain.js", fileContent, function(err){
				if(err){
					throw err;
				}
				raw_dossier.mount("/code", "constitution", ref.getSeed(), (err) => {
					assert.true(typeof err === "undefined" || err === null);
					raw_dossier.writeFile("just_a_file", "fileContent", function (err) {
						if (err) {
							throw err;
						}
						assert.true(typeof err === "undefined" || err === null);
						const dossier = require("dossier");
						dossier.load(raw_dossier.getSeed(), "test", (err, handler) => {
							if (err) {
								throw err;
							}

							handler.startTransaction("echo", "say", "just test").onReturn((err, result) => {
								if(err){
									throw err;
								}
								testFinishCallback();
							});
						});
					});
				});
			});
		});
	});
}, 10000);

