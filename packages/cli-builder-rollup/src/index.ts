import path from 'node:path';
import {fs} from '@wylxb/cli-shared-utils';

import {OutputOptions, rollup, RollupOptions} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import {getConfig} from './config';

type IRollupOptions = RollupOptions & {output: OutputOptions};

type IRollupMode = 'cjs' | 'esm';

type RollupBuilderCallback = (mode: IRollupMode, config: IRollupOptions) => IRollupOptions;

const root = process.cwd();

const resolve = (...args: string[]) => path.resolve(root, ...args);

const pkg = fs.readJSONSync(resolve(root, 'package.json'));

const defineConfig = (() => {
    const cmdConfig = getConfig();
    return (config: IRollupOptions) => {
        return {
            ...config,
            input: cmdConfig.input ? resolve(root, cmdConfig.input) : config.input,
        };
    };
})();

const sharedOptions = (isProduction: boolean) => defineConfig({
    input: resolve(root, 'src/index.ts'),
    treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
    },
    output: {
        dir: path.resolve(root, 'lib'),
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/dep-[hash].mjs',
        exports: 'named',
        format: 'esm',
        externalLiveBindings: false,
        freeze: false,
        sourcemap: false,
    },
    external: [
        'fsevents',
        ...(pkg.dependencies ? Object.keys(pkg.dependencies) : []),
        ...(isProduction || !pkg.devDependencies ? [] : Object.keys(pkg.devDependencies)),
    ],
    plugins: [
        nodeResolve({preferBuiltins: true}),
        typescript({
            compilerOptions: {
                target: 'esnext',
            },
        }),
        commonjs({
            extensions: ['.js'],
        }),
    ],
    onwarn(warning, warn) {
        // node-resolve complains a lot about this but seems to still work?
        if (warning.message.includes('Package subpath')) {
            return;
        }
        // we use the eval('require') trick to deal with optional deps
        if (warning.message.includes('Use of eval')) {
            return;
        }
        if (warning.message.includes('Circular dependency')) {
            return;
        }
        warn(warning);
    },
});

function createCJSConfig(isProduction: boolean) {
    const shared = sharedOptions(isProduction);
    return defineConfig({
        ...shared,
        output: {
            ...shared.output,
            format: 'cjs',
            entryFileNames: '[name].cjs',
            chunkFileNames: 'chunks/dep-[hash].cjs',
        },
    });
}

function createESMConfig(isProduction: boolean) {
    return sharedOptions(isProduction);
}

export default async function rollupBuilder(callback?: RollupBuilderCallback) {
    const isProduction = process.env.NODE_ENV === 'production';

    const configs = new Map<IRollupMode, IRollupOptions>([
        ['cjs', createCJSConfig(isProduction)],
        ['esm', createESMConfig(isProduction)],
    ]);

    for (const [mode, rawConfig] of configs) {
        const config = callback ? callback(mode, rawConfig) : rawConfig;
        const bundle = await rollup(config);
        bundle.write(config.output);
    }
}

if (process.env.WB_ENV === 'debug') {
    rollupBuilder();
}
