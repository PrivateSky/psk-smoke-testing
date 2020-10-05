require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const dc = require("double-check");
const assert = dc.assert;
const fs = require("fs");
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const keySSISpace = openDSU.loadApi("keyssi");
const bdns = openDSU.loadApi("bdns");

assert.callback("Wallet generator", (testFinishCallback) => {
    dc.createTestFolder("wallet", function (err, folder) {
        const no_retries = 10;
        tir.launchVirtualMQNode(no_retries, folder, function (err, port) {
            if (err) {
                throw err;
            }

            bdns.addRawInfo("default", {
                brickStorages: [`http://localhost:${port}`],
                anchoringServices: [`http://localhost:${port}`]
            });

            const webAppFolder = folder + "\\web";
            fs.mkdirSync(webAppFolder, {recursive: true});
            fs.writeFileSync(webAppFolder + "/index.html", "Hello World!");
            generateWallet(webAppFolder, testFinishCallback);
        });
    });
}, 5000);

function generateWallet(webappFolder, callback) {
    resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, walletTemplate) => {
        if (err) {
            throw err;
        }
        walletTemplate.addFolder("../../../psknode/bundles", "/", (err) => {
            if (err) {
                throw err;
            }

            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, wallet) => {
                if (err) {
                    throw err;
                }
                walletTemplate.getKeySSI((err, walletTemplateKeySSI) => {
                    if (err) {
                        throw err;
                    }
                    wallet.mount("/constitution", walletTemplateKeySSI, function (err) {
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

                                callback();
                            })
                        });
                    });
                });
            })
        });
    })

}
