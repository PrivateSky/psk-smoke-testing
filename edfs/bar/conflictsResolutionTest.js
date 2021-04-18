const util = require('util');
require('../../../../psknode/bundles/testsRuntime');
require("../../../../psknode/bundles/pskWebServer");

const double_check = require("double-check");
const assert = double_check.assert;

const tir = require("../../../../psknode/tests/util/tir.js");

double_check.createTestFolder("conflictsresolution_test_folder", (err, testFolder) => {
    assert.true(err === null || typeof err === "undefined", "Failed to create test folder");

    const fileData = "Lorem Ipsum is simply dummy text";

    assert.callback("ConflictsResolutionTest", (callback) => {
        const openDSU = require("opendsu");
        const resolver = openDSU.loadApi("resolver");
        const keySSISpace = openDSU.loadApi("keyssi");

        const createDSU = util.promisify(resolver.createDSU);
        const loadDSU = util.promisify(resolver.loadDSU);

        let mainDSU;
        let secondaryDSU;
        let thirdDSU;

        let mainDSUKeySSI;
        let secondaryDSUKeySSI;
        let thirdDSUKeySSI;

        //let dsuKeySSI;
        //let dsu1;
        //let dsu2;

        //const promisifyDSUs = (method, ...dsus) => {
        //const promisifiedMethods = [];
        //for (const dsu of dsus) {
        //promisifiedMethods.push(util.promisify(dsu[method]));
        //}

        //return promisifiedMethods;
        //}

        //const sleep = () => {
        //return new Promise((resolve) => {
        //setTimeout(resolve, 1000);
        //})
        //}


        //const triggerConflict = async () => {
        //const openDSU = require("opendsu");
        //const resolver = openDSU.loadApi("resolver");
        //const keySSISpace = openDSU.loadApi("keyssi");

        //const [writeFile1, writeFile2] = promisifyDSUs('writeFile', dsu1, dsu2);
        //const [createFolder1, createFolder2] = promisifyDSUs('createFolder', dsu1, dsu2);
        //const [deleteFile] = promisifyDSUs('delete', dsu1);
        //const [renameFile] = promisifyDSUs('rename', dsu2);

        //await deleteFile('a.txt');
        //await createFolder1('folder/subfolder');
        //await writeFile1('folder/subfolder/b.txt', 'Test');
        //await sleep();
        //console.log('------------------------');
        ////await renameFile('a.txt', 'b.txt');
        //await writeFile1('a.txt', 'text 1');
        //try {
        //await writeFile2('a.txt', 'text 2');
        //} catch (e) {
        //console.log(e.conflicts);
        //}
        //callback();

        ////console.log('----------------writing first file');
        ////await writeFile1('a.txt', 'First text', {encrypt: false});
        ////console.log('----------------writing second file');
        ////await writeFile2('a.txt', 'Second text', {encrypt: false});

        ////resolver.invalidateDSUCache(dsuKeySSI);

        ////console.log('-------------loading')
        ////resolver.loadDSU(dsuKeySSI, (err, dsu) => {
        ////dsu.readFile('a.txt', (err, data) => {
        ////console.log(data.toString());
        ////callback();
        ////})
        ////})
        //}

        //const loadSescondDSU = (keySSI) => {
        //tir.launchVirtualMQNode(10, testFolder, (err, port) => {
        //assert.true(err === null || typeof err === "undefined", "Failed to create server");

        //const openDSU = require("opendsu");
        //const resolver = openDSU.loadApi("resolver");
        //const keySSISpace = openDSU.loadApi("keyssi");

        //resolver.loadDSU(keySSI, (err, bar) => {
        //if (err) {
        //throw err;
        //}
        //dsu2 = bar;
        //triggerConflict();
        //})
        //});
        //}

        // Bootstrap test
        tir.launchVirtualMQNode(10, testFolder, async (err, port) => {
            assert.true(err === null || typeof err === "undefined", "Failed to create server");

            // Create DSUs
            try {
                mainDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
                secondaryDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
                thirdDSU = await createDSU(keySSISpace.createTemplateSeedSSI('default'));
            } catch (e) {
                throw e;
            }

            promisifyDSU(mainDSU, secondaryDSU, thirdDSU);

            console.log('Creating content for mainDSU');
            console.log('------------------');
            await createDSUContent(mainDSU, {
                'm1.txt': 'file contents',
                'm2.txt': 'file contents',
                'mfolder': {
                    'mf1.txt': 'file contents',
                    'mf2.txt': 'file contents',
                    'msub-folder': {
                        'msf1.txt': 'file contents',
                        'msf2.txt': 'file contents'
                    }
                }
            });

            console.log('Creating content for secondaryDSU');
            console.log('------------------');
            await createDSUContent(secondaryDSU, {
                's1.txt': 'file contents',
                's2.txt': 'file contents',
                'sfolder': {
                    'sf1.txt': 'file contents',
                    'sf2.txt': 'file contents',
                    'ssub-folder': {
                        'ssf1.txt': 'file contents',
                        'ssf2.txt': 'file contents'
                    }
                }
            });

            console.log('Creating content for thirdDSU');
            console.log('------------------');
            await createDSUContent(thirdDSU, {
                't1.txt': 'file contents',
                't2.txt': 'file contents',
                'tfolder': {
                    'tf1.txt': 'file contents',
                    'tf2.txt': 'file contents',
                    'tsub-folder': {
                        'tsf1.txt': 'file contents',
                        'tsf2.txt': 'file contents'
                    }
                }
            });

            mainDSUKeySSI = await mainDSU.getKeySSIAsString();
            secondaryDSUKeySSI = await secondaryDSU.getKeySSIAsString();
            thirdDSUKeySSI = await thirdDSU.getKeySSIAsString();
            resolver.invalidateDSUCache(mainDSUKeySSI);
            resolver.invalidateDSUCache(secondaryDSUKeySSI);
            resolver.invalidateDSUCache(thirdDSUKeySSI);

            console.log('------------------');
            console.log('Running tests...');
            await runTests();

            callback();
        });

        const runTests = async () => {
            await testOvewriteFileConflict();
            //await testNewlyAddedFilesAreMerged();
        };

        const testOvewriteFileConflict = async () => {
            const [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);
            await user1DSU.writeFile('m3.txt', 'm3.txt - Wrote by first user');

            let conflictsError;
            try {
                // This should fail since it would overwrite the m3.txt
                await user2DSU.writeFile('m3.txt', 'm3.txt - Wrote by second user');
            } catch (e) {
                conflictsError = e.conflicts;
            }

            assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            assert.true(typeof conflictsError['/m3.txt'] !== 'undefined');
            assert.true(conflictsError['/m3.txt'].error === 'LOCAL_OVERWRITE');
            assert.true(Array.isArray(conflictsError['/m3.txt'].remoteHashLinks));
        };

        const testNewlyAddedFilesAreMerged = async () => {
            console.log('--------vlad');
            let [user1DSU, user2DSU] = await loadDSUAs2Users(mainDSUKeySSI);
            await user1DSU.writeFile('m4.txt', 'm4.txt - Wrote by first user');
            await user2DSU.writeFile('m5.txt', 'm5.txt - Wrote by second user');

            let data = await user1DSU.listFiles('/');
            console.log(data);
            data = await user2DSU.listFiles('/');
            console.log(data);

            //assert.true(typeof conflictsError !== 'undefined', 'Conflict error was not triggered');
            //assert.true(typeof conflictsError['/m3.txt'] !== 'undefined');
            //assert.true(conflictsError['/m3.txt'].error === 'LOCAL_OVERWRITE');
            //assert.true(Array.isArray(conflictsError['/m3.txt'].remoteHashLinks));
        };


        // Helper functions
        const createDSUContent = async (dsu, content, root = '/') => {
            if (root === '/') {
                await dsu.beginBatch();
            }

            for (let key in content) {
                const path = `${root}${key}`;
                console.log('Creating ' + path);

                if (typeof content[key] === 'object') {
                    await dsu.createFolder(path);
                    await createDSUContent(dsu, content[key], `${path}/`);
                    continue;
                }

                await dsu.writeFile(path, `${key} - ${content[key]}`);
            }

            if (root === '/') {
                await dsu.commitBatch();
            }
        }

        const promisifyDSU = (...args) => {
            // Methods to promisify
            const methodsToPromisify = [
                'getLastHashLinkSSI',
                'getKeySSI',
                'getKeySSIAsObject',
                'getKeySSIAsString',
                'addFiles',
                'appendToFile',
                'addFolder',
                'addFile',
                'readFile',
                'extractFolder',
                'extractFile',
                'writeFile',
                'delete',
                'rename',
                'listFiles',
                'listFolders',
                'createFolder',
                'cloneFolder',
                'readDir',
                'mount',
                'unmount',
                'listMountedDSUs',
                'commitBatch',
                'cancelBatch',
                'batch',
            ]

            for (const dsu of args) {
                for (const method of methodsToPromisify) {
                    dsu[method] = util.promisify(dsu[method]);
                }
            }
        }

        /**
         * Simulate two distinct users loading the same DSU
         */
        const loadDSUAs2Users = async (keySSI) => {
            resolver.invalidateDSUCache(keySSI);
            const user1DSU = await loadDSU(keySSI);
            resolver.invalidateDSUCache(keySSI);
            const user2DSU = await loadDSU(keySSI);
            promisifyDSU(user1DSU, user2DSU);

            return [user1DSU, user2DSU];
        }

    }, 20000);
});


