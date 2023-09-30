import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
    concurrency: 10,
    coverage: true,
    nodeResolve: true,
    // in a monorepo you need to set set the root dir to resolve modules
    rootDir: "../../../",
    files: [
        "dist/**/*.spec.js",
        "!**/node_modules/**"
    ],
};