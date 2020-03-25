require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const dc = require("double-check");
const assert = dc.assert;

assert.callback("Wallet generator", (testFinishCallback) => {
	dc.createTestFolder("wallet", function (err, folder) {
		const no_retries = 10;
		tir.launchVirtualMQNode(no_retries, folder, function (err, port) {
			if (err) {
				throw err;
			}
			const EDFS_HOST = `http://localhost:${port}`;
			const fs = require("fs");
			const webAppFolder = folder + "/web";
			fs.mkdirSync(webAppFolder, {recursive: true});
			fs.mkdirSync(webAppFolder+"/assets/js", {recursive: true});
			fs.writeFileSync(webAppFolder + "/index.html", "Hello World!");
			fs.writeFileSync(webAppFolder + "/assets/js/index.js", "Hello World from JS!");
			generateWallet(EDFS_HOST, webAppFolder, testFinishCallback);
		});
	});
}, 15000);

function generateWallet(endpoint, webappFolder, callback) {
	const fs = require("fs");
	const EDFS = require("edfs");
	let edfs = EDFS.attachToEndpoint(endpoint);

	let walletTemplate = edfs.createCSB();

	walletTemplate.addFolder("../../../psknode/bundles", "/", {encrypt: true, depth: 0}, (err) => {
		if (err) {
			throw err;
		}
		let wallet = edfs.createCSB();
		wallet.mount("/", "constitution", walletTemplate.getSeed(), function (err) {
			if (err) {
				throw err;
			}
		});
		wallet.addFolder(webappFolder, "app", {encrypt: true, depth: 0}, function (err) {
			if (err) {
				throw err;
			}
			wallet.listFiles("/app/assets", function(err, files){
				console.log(files);
			});
			wallet.readFile("/app/assets/js/index.html", function (err, content) {
				if (err) {
					throw  err;
				}
				console.log("File Content", content.toString());
				const seed = wallet.getSeed();
				console.log("Wallet seed", seed);
				if (callback) {
					callback(seed);
				}
			})
		});
	});
}