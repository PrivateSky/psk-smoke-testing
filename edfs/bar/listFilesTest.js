require('../../../../psknode/bundles/testsRuntime');

const double_check = require("double-check");
const assert = double_check.assert;

let folderPath;
let filePath;

let files;

const tir = require("../../../../psknode/tests/util/tir.js");

const text = ["first", "second", "third"];

require("callflow").initialise();

$$.flows.describe("ListFilesTest", {
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

                        this.testListingFilesTopLevel(dsu)
                    })
                });
            });
        });
    },

    createDSU: function (callback) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        resolver.createDSU(keySSISpace.createTemplateSeedSSI("default"), (err, dsu) => {
            if (err) {
                throw err;
            }

            callback(dsu);
        });
    },

    testListingFilesTopLevel: function (dsu) {
        dsu.listFiles('/', (err, files) => {
            if (err) {
                throw err;
            }

            assert.true(files.indexOf('fld1/a.txt') !== -1, 'File a.txt not in folder')
            assert.true(files.indexOf('fld1/b.txt') !== -1, 'File b.txt not in folder')
            assert.true(files.indexOf('fld1/c.txt') !== -1, 'File c.txt not in folder')

            assert.true(files.indexOf('fld1/fld2/a.txt') !== -1, 'File fld2/a.txt not in folder')
            assert.true(files.indexOf('fld1/fld2/b.txt') !== -1, 'File fld2/b.txt not in folder')
            assert.true(files.indexOf('fld1/fld2/c.txt') !== -1, 'File fld2/c.txt not in folder')


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

                        level2DSU.getKeySSIAsString((err, identifier) => {
                            if (err) {
                                throw err;
                            }

                            level1DSU.mount('/level2', identifier, (err) => {
                                if (err) {
                                    throw err;
                                }

                                level1DSU.getKeySSIAsString((err, identifier) => {
                                    if (err) {
                                        throw err;
                                    }

                                    dsu.mount('/level1', identifier, (err) => {
                                        if (err) {
                                            throw err;
                                        }

                                        dsu.getKeySSIAsString((err, identifier) => {
                                            if (err) {
                                                throw err;
                                            }

                                            this.testListingFilesFromMountedDSUs(identifier)
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

    testListingFilesFromMountedDSUs: function (keySSI) {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        resolver.loadDSU(keySSI, (err, dsu) => {
            if (err) {
                throw err;
            }

            dsu.listFiles('/', (err, files) => {
                if (err) {
                    throw err;
                }

                assert.true(files.indexOf('fld1/a.txt') !== -1, 'Files not listed');
                assert.true(files.indexOf('fld1/fld2/b.txt') !== -1, 'Files not listed');
                assert.true(files.indexOf('level1/level2/fld/c.txt') !== -1, 'Level 2 mounted files not listed')
                assert.true(files.indexOf('level1/fld/a.txt') !== -1, 'Level 1 mounted files not listed')

                dsu.readFile('level1/level2/fld/b.txt', (err, data) => {
                    if (err) {
                        throw err;
                    }

                    assert.true('second' === data.toString(), 'Wrong content for mounted b.txt file')
                    this.callback();
                })
            });
        })
    },
});

double_check.createTestFolder("list_files_test_folder", (err, testFolder) => {
    const path = require("path");
    folderPath = path.join(testFolder, "fld");
    files = ["fld/a.txt", "fld/b.txt", "fld/c.txt"].map(file => path.join(testFolder, file));
    filePath = path.join(testFolder, "test.txt");
    assert.callback("List files", (callback) => {
        $$.flows.start("ListFilesTest", "start", callback);
    }, 3000);
});
