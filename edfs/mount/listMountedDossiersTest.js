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
        const mountingPoints = [{path: "/", name: "dir", seed: edfs.createCSB().getSeed()}, {
            path: "/dir",
            name: "test",
            seed: edfs.createCSB().getSeed()
        }, {path: "/test", name: "folder", seed: edfs.createCSB().getSeed()}];

        let raw_dossier = edfs.createCSB();
        raw_dossier.writeFile("testFile", "testContent", (err) => {
            if (err) {
                throw err;
            }

            __mount(0);
        });


        function __mount(index) {
            let mount = mountingPoints[index];
            raw_dossier.mount(mount.path, mount.name, mount.seed, (err) => {
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
            raw_dossier.listMountedDossiers("/", (err, mountedDossiers) => {
                if (err) {
                    throw err;
                }

                assert.true(mountedDossiers.length === mountingPoints.length);
                testFinishCallback();
            });
        }
    });
}, 5000);

