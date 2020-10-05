require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");

const tir = require("../../../psknode/tests/util/tir");
const dc = require("double-check");
const assert = dc.assert;
const openDSU = require("opendsu");
const resolver = openDSU.loadApi("resolver");
const keySSISpace = openDSU.loadApi("keyssi");
const bdns = openDSU.loadApi("bdns");

const assetsIndexData = "Hello World from JS!";
const indexData = "Hello World!";

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

            const fs = require("fs");
            const webAppFolder = folder + "/web";
            fs.mkdirSync(webAppFolder, {recursive: true});
            fs.mkdirSync(webAppFolder + "/assets/js", {recursive: true});
            fs.writeFileSync(webAppFolder + "/index.html", indexData);
            fs.writeFileSync(webAppFolder + "/assets/js/index.js", assetsIndexData);
            generateWallet(webAppFolder, testFinishCallback);
        });
    });
}, 15000);

function generateWallet(webappFolder, callback) {
    resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, walletTemplate) => {
        if (err) {
            throw err;
        }

        walletTemplate.addFolder("../../../psknode/bundles", "/", {encrypt: true, depth: 0}, (err) => {
            if (err) {
                throw err;
            }
            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, wallet) => {
                if (err) {
                    throw err;
                }

                walletTemplate.getKeySSI((err, keySSI) => {
                    if (err) {
                        throw err;
                    }
                    wallet.mount("/constitution", keySSI, function (err) {
                        if (err) {
                            throw err;
                        }
                    });
                    wallet.addFolder(webappFolder, "app", {encrypt: true, depth: 0}, function (err) {
                        if (err) {
                            throw err;
                        }
                        wallet.listFiles("/app/assets", function (err, files) {
                            if (err) {
                                throw err;
                            }

                            assert.arraysMatch(['js/index.js'], files);

                            wallet.readFile("/app/assets/js/index.js", function (err, content) {
                                if (err) {
                                    throw  err;
                                }

                                assert.true(content.toString() === assetsIndexData);

                                callback();
                            })
                        });
                    });
                });
            })
        });
    })
}
