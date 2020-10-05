require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("List mounted dossiers test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");
        const bdns = openDSU.loadApi("bdns");
        bdns.addRawInfo("default", {
            brickStorages: [`http://localhost:${port}`],
            anchoringServices: [`http://localhost:${port}`]
        });

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dossier) => {
            if (err) {
                throw err;
            }

            resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, anotherDossier) => {
                if (err) {
                    throw err;
                }

                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, yetAnotherDossier) => {
                    if (err) {
                        throw err;
                    }
                    dossier.getKeySSI((err, dossierKeySSI) => {
                        if (err) {
                            throw err;
                        }

                        anotherDossier.getKeySSI((err, anotherDossierKeySSI) => {
                            if (err) {
                                throw err;
                            }

                            yetAnotherDossier.getKeySSI((err, yetAnotherDossierKeySSI) => {
                                if (err) {
                                    throw err;
                                }

                                const mountingPoints = [{path: "/temp", name: "dir", seed: dossierKeySSI}, {
                                    path: "/temp/dossier1/folder",
                                    name: "dossier2",
                                    seed: anotherDossierKeySSI
                                }, {path: "/temp/dossier1/folder", name: "dossier3", seed: yetAnotherDossierKeySSI}];

                                resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, raw_dossier) => {
                                    if (err) {
                                        throw err;
                                    }

                                    raw_dossier.writeFile("testFile", "testContent", (err) => {
                                        if (err) {
                                            throw err;
                                        }

                                        function __mount(index) {
                                            let mount = mountingPoints[index];
                                            raw_dossier.mount(mount.path + "/" + mount.name, mount.seed, (err) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                if (index === mountingPoints.length - 1) {
                                                    startTest();
                                                } else {
                                                    __mount(index + 1);
                                                }
                                            });
                                        }

                                        function startTest() {
                                            raw_dossier.listMountedDossiers("/temp/dossier1/folder", (err, mountedDossiers) => {
                                                if (err) {
                                                    throw err;
                                                }

                                                assert.true(mountedDossiers.length === 2);
                                                testFinishCallback();
                                            });
                                        }

                                        __mount(0);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

    });
}, 5000);

