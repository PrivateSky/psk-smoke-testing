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
            const webAppFolder = folder + "\\web";
            fs.mkdirSync(webAppFolder, {recursive: true});
            fs.writeFileSync(webAppFolder + "/index.html", "Hello World!");
            generateWallet(EDFS_HOST, webAppFolder, testFinishCallback);
        });
    });
}, 5000);

function generateWallet(endpoint, webappFolder, callback) {
    const fs = require("fs");
    const EDFS = require("edfs");
    let edfs = EDFS.attachToEndpoint(endpoint);

    edfs.createRawDossier((err, walletTemplate) => {
        if (err) {
            throw err;
        }
        walletTemplate.addFolder("../../../psknode/bundles", "/", (err) => {
            if (err) {
                throw err;
            }

            edfs.createRawDossier((err, wallet) => {
                wallet.mount("/constitution", walletTemplate.getSeed(), function (err) {
                    if (err) {
                        throw err;
                    }

                    wallet.addFolder(webappFolder, "app", function (err) {
                        if (err) {
                            throw err;
                        }

                        wallet.readFile("/app/index.html", function (err, content) {
                            if (err) {
                                throw  err;
                            }

                            const seed = wallet.getSeed();
                            if (callback) {
                                callback(seed);
                            }
                        })
                    });
                });
            })
        });
    })

}
