/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from '@rollup/plugin-commonjs';
import pkg from "./package.json";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${new Date().toISOString().split("T")[0]} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

// Native dependencies (transitive) that need to be excluded from the bundle
const nativeDependencies = [
    "@napi-rs/keyring-darwin-arm64",
    "@napi-rs/keyring-linux-arm64-gnu",
    "@napi-rs/keyring-linux-arm64-musl",
    "@napi-rs/keyring-win32-arm64-msvc",
    "@napi-rs/keyring-darwin-x64",
    "@napi-rs/keyring-win32-x64-msvc",
    "@napi-rs/keyring-linux-x64-gnu",
    "@napi-rs/keyring-linux-x64-musl",
    "@napi-rs/keyring-freebsd-x64",
    "@napi-rs/keyring-win32-ia32-msvc",
    "@napi-rs/keyring-linux-arm-gnueabihf",
    "@napi-rs/keyring-linux-riscv64-gnu"
]

export default [
    {
        // for cjs build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "cjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            entryFileNames: "[name].cjs",
            banner: fileHeader,
            sourcemap: true
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            ...nativeDependencies
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            nodeResolve({
                preferBuiltins: true
            }),
            commonjs()
        ]
    },
    {
        // for esm build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "es",
            entryFileNames: "[name].mjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            banner: fileHeader,
            sourcemap: true
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            ...nativeDependencies
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            nodeResolve({
                preferBuiltins: true
            }),
            commonjs()
        ]
    }
];
