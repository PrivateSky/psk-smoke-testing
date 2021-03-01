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

            generateWallet( "webAppFolder", testFinishCallback);
        });
    });
}, 15000);

function generateWallet(webappFolder, callback) {
    const openDSU = require("opendsu");
    const resolver = openDSU.loadApi("resolver");
    const keySSISpace = openDSU.loadApi("keyssi");
    resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, appTemplate) => {
        if (err) {
            throw err;
        }

        const indexContent = "profile-app index content";
        appTemplate.writeFile("/index.html", indexContent, function (err) {
            if (err) {
                throw err;
            }

            resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, app) => {
                if (err) {
                    throw err;
                }
                appTemplate.getKeySSIAsString((err, appTemplateKeySSI) => {
                    if (err) {
                        throw err;
                    }
                    app.mount("/code", appTemplateKeySSI, function (err) {
                        if (err) {
                            throw err;
                        }

                        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, walletTemplate) => {
                            if (err) {
                                throw err;
                            }

                            walletTemplate.writeFile("/index.html", "wallet index content", function (err) {
                                if (err) {
                                    throw err;
                                }

                                resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, wallet) => {
                                    if (err) {
                                        throw err;
                                    }
                                    walletTemplate.getKeySSIAsString((err, walletTemplateKeySSI) => {
                                        if (err) {
                                            throw err;
                                        }
                                        wallet.mount("/code", walletTemplateKeySSI, function (err) {
                                            if (err) {
                                                throw err;
                                            }

                                            app.getKeySSIAsString((err, appKeySSI) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                wallet.mount("/apps/profile-app", appKeySSI, function (err) {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    wallet.getKeySSIAsString((err, walletKeySSI) => {
                                                        if (err) {
                                                            throw err;
                                                        }
                                                        resolver.loadDSU(walletKeySSI, (err, doi) => {
                                                            if (err) {
                                                                throw err;
                                                            }

                                                            doi.readFile("/apps/profile-app/code/index.html", function (err, content) {
                                                                if (err) {
                                                                    throw err;
                                                                }
                                                                assert.true(content.toString() === indexContent);
                                                                callback();
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });

                                    })
                                });
                            });

                        });
                    });
                })


            });

        })
    })
}
