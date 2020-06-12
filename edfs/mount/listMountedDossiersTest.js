require("../../../../psknode/bundles/testsRuntime");
require("../../../../psknode/bundles/pskruntime");

const tir = require("../../../../psknode/tests/util/tir");
const assert = require("double-check").assert;

assert.callback("List mounted dossiers test", (testFinishCallback) => {
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }
        const EDFS_HOST = `http://localhost:${port}`;

        const EDFS = require("edfs");
        let edfs = EDFS.attachToEndpoint(EDFS_HOST);
        edfs.createRawDossier((err, dossier) => {
            if (err) {
                throw err;
            }

            edfs.createRawDossier((err, anotherDossier) => {
                if (err) {
                    throw err;
                }

                edfs.createRawDossier((err, yetAnotherDossier) => {
                    if (err) {
                        throw err;
                    }
                    const mountingPoints = [{path: "/temp", name: "dir", seed: dossier.getSeed()}, {
                        path: "/temp/dossier1/folder",
                        name: "dossier2",
                        seed: anotherDossier.getSeed()
                    }, {path: "/temp/dossier1/folder", name: "dossier3", seed: yetAnotherDossier.getSeed()}];

                    edfs.createRawDossier((err, raw_dossier) => {
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
}, 5000);

