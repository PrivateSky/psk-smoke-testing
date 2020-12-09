require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");

const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("ListFoldersTest", {
    start: function (callback) {
        this.callback = callback;

        double_check.ensureFilesExist([folderPath], files, text, (err) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create folder hierarchy.");

            tir.launchVirtualMQNode((err, port) => {
                assert.true(err === null || typeof err === "undefined", "Failed to create server.");

                this.createDSU((dsu) => {
                    dsu.batch((done) => {
                        dsu.addFolder(folderPath, 'fld1', (err) => {
                            if (err) {
                                return done(err);
                            }

                            dsu.addFolder(folderPath, 'fld1/fld2', (err) => {
                                if (err) {
                                    return done(err);
                                }
                                done();
                            })
                        });
                    }, (err) => {
                        if (err) {
                            throw err;
                        }

                        this.testListingFoldersTopLevel(dsu)
                    })
                });
            });
        });
    },

    createDSU: function (callback) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.buildSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            callback(dsu);
        });
    },

    testListingFoldersTopLevel: function (dsu) {
        dsu.listFolders('/', {recursive: true}, (err, folders) => {
            if (err) {
                throw err;
            }

            assert.true(folders.indexOf('fld1') !== -1, 'Folder not in dsu')
            assert.true(folders.indexOf('fld1/fld2') !== -1, 'Subfolder not in dsu')

            this.mountDSUs(dsu)
        })
    },

    mountDSUs: function (dsu) {
        this.createDSU((level1DSU) => {
            level1DSU.addFolder(folderPath, 'fld', (err) => {
                if (err) {
                    throw err;
                }

                this.createDSU((level2DSU) => {
                    level2DSU.addFolder(folderPath, 'fld', (err) => {
                        if (err) {
                            throw err;
                        }

                        level2DSU.getKeySSI((err, identifier) => {
                            if (err) {
                                throw err;
                            }

                            level1DSU.mount('/level2', identifier, (err) => {
                                if (err) {
                                    throw err;
                                }

                                level1DSU.getKeySSI((err, identifier) => {
                                    if (err) {
                                        throw err;
                                    }

                                    dsu.mount('/level1', identifier, (err) => {
                                        if (err) {
                                            throw err;
                                        }

                                        dsu.getKeySSI((err, identifier) => {
                                            if (err) {
                                                throw err;
                                            }

                                            this.testListingFoldersFromMountedDSUs(identifier)
                                        })
                                    })
                                })
                            })
                        })
                    })

                });
            })
        })

    },

    testListingFoldersFromMountedDSUs: function (keySSI) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");

        resolver.loadDSU(keySSI, (err, dsu) => {
            if (err) {
                throw err;
            }

            dsu.listFolders('/', {recursive: true}, (err, folders) => {
                if (err) {
                    throw err;
                }


                assert.true(folders.indexOf('fld1') !== -1, 'Folder not listed');
                assert.true(folders.indexOf('fld1/fld2') !== -1, 'Folder not listed recursively');
                assert.true(folders.indexOf('level1/level2/fld') !== -1, 'Level 2 mounted folders not listed')
                assert.true(folders.indexOf('level1/fld') !== -1, 'Level 1 mounted folders not listed')

                this.callback();
            });
        })
    },
});

double_check.createTestFolder("list_files_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("List folders", (callback) => {
        $$.flows.start("ListFoldersTest", "start", callback);
    //}, 3000);
    }, 3000 * 1000);
});
