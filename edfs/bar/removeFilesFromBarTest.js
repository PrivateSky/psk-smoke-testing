require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskruntime");
require("../../../../psknode/bundles/pskWebServer");
require("../../../../psknode/bundles/edfsBar");

const double_check = require("double-check");
const assert = double_check.assert;
const edfsModule = require("edfs");
const tir = require("../../../../psknode/tests/util/tir");

let folderPath;

let files;

const text = ["first", "second", "third"];

$$.flows.describe("RemoveFilesFromBar", {
	start: function (callback) {
		this.callback = callback;
		$$.securityContext = require("psk-security-context").createSecurityContext();

		double_check.ensureFilesExist([folderPath], files, text, (err) => {
			assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

			tir.launchVirtualMQNode((err, port) => {
				assert.true(err === null || typeof err === "undefined", "Failed to create server.");
				$$.BDNS.addConfig("default", {
					endpoints: [
						{
							endpoint:`http://localhost:${port}`,
							type: 'brickStorage'
						},
						{
							endpoint:`http://localhost:${port}`,
							type: 'anchorService'
						}
					]
				})
				this.createBAR();
			});
		});

	},

	createBAR: function () {
		$$.securityContext.generateIdentity((err, agentId) => {
			assert.true(err === null || typeof err === "undefined", "Failed to generate identity.");

			edfsModule.createDSU("Bar", (err, bar) => {
				if (err) {
					throw err;
				}

				this.archive = bar;
				this.addFolder();
			});
		});
	},

	addFolder: function () {
		this.archive.addFolder(folderPath, "/", (err, mapDigest) => {
			if (err) {
				throw err;
			}
			assert.true(err === null || typeof err === "undefined", "Failed to add folder.");
			this.listFiles((err, initialFiles) => {
				if (err) {
					throw err;
				}

				this.removeFile(initialFiles[0], (err) => {
					if (err) {
						throw err;
					}
				});

				this.listFiles( (err, filesAfterRemoval) => {
					if (err) {
						throw err;
					}

					assert.arraysMatch(initialFiles.slice(1), filesAfterRemoval);
					this.callback();
				});
			});
		});
	},

	listFiles: function (callback) {
		this.archive.listFiles("/", callback);
	},

	removeFile: function (file, callback) {
		this.archive.delete(file, callback);
	}
});

double_check.createTestFolder("bar_test_folder", (err, testFolder) => {

	const path = require("path");
	folderPath = path.join(testFolder, "fld");
	files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));

	assert.callback("Remove files from bar test", (callback) => {
			$$.flows.start("RemoveFilesFromBar", "start", callback);
		}, 6000
	);
});
