require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const dc = require("double-check");
const assert = dc.assert;

assert.callback("Wallet generator", (testFinishCallback) => {
	dc.createTestFolder("wallet", function (err, folder) {
		const no_retries = 10;
		console.log("Incerc sa lansez vmq");
		tir.launchVirtualMQNode(no_retries, folder, function (err, port) {
			if (err) {
				throw err;
			}
			console.log("am lansat vmq");

			const EDFS_HOST = `http://localhost:${port}`;
			generateWallet(EDFS_HOST, "webAppFolder", testFinishCallback);
		});
	});
}, 15000);

function generateWallet(endpoint, webappFolder, callback) {
	const fs = require("fs");
	const EDFS = require("edfs");
	let edfs = EDFS.attachToEndpoint(endpoint);
	let walletTemplate = edfs.createRawDossier();
	let appTemplate = edfs.createRawDossier();
	let app = edfs.createRawDossier();
	const wallet = edfs.createRawDossier();

	appTemplate.writeFile("/index.html", "profile-app index content", function(err) {
		if (err) {
			throw err;
		}

		app.mount("/", "code", appTemplate.getSeed(), function(err){
			if(err){
				throw err;
			}
			walletTemplate.writeFile("/index.html", "wallet index content", function(err){
				if(err){
					throw err;
				}
				wallet.mount("/", "code", walletTemplate.getSeed(), function(err){
					if(err){
						throw err;
					}
					wallet.mount("/apps", "profile-app", app.getSeed(),  function(err){
						if(err){
							throw err;
						}

						let doi = edfs.loadRawDossier(wallet.getSeed());
						/*app.listMountedDossiers("/", function(err, files){
							if(err){
								throw err;
							}
							console.log(files);
							callback();
						})*/
						/*
								"/apps/profile-app//code//index.html"
						 */
						doi.readFile("/apps/profile-app/code/index.html", function(err, content){
							if(err){
								throw err;
							}
							console.log(content.toString());
							callback();
						});
					});
				});
			});
		});

	});
}