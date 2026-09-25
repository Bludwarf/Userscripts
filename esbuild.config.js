const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Détection automatique des points d'entrée dans src/scripts/
const entryDir = 'src/scripts';
const entries = fs
    .readdirSync(entryDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.basename(f, '.ts'));

function requireBanner(name) {
    return require(`./${entryDir}/${name}.meta.js`);
}

async function buildAll() {
    for (const name of entries) {
        await esbuild.build({
            entryPoints: [`${entryDir}/${name}.ts`],
            bundle: true,
            outfile: `dist/${name}.user.js`,
            format: 'iife',
            target: 'es2020',
            banner: {js: requireBanner(name)},
            minify: false,
            sourcemap: false, // pas utile pour un fichier standalone final
        });
        console.log(`✅ Build réussi : dist/${name}.user.js`);
    }
}

const isWatch = process.argv.includes('--watch');

async function main() {
    if (isWatch) {
        const contexts = await Promise.all(
            entries.map((name) =>
                esbuild.context({
                    entryPoints: [`${entryDir}/${name}.ts`],
                    bundle: true,
                    outfile: `dist/${name}.user.js`,
                    format: 'iife',
                    target: 'es2020',
                    banner: {js: requireBanner(name)},
                })
            )
        );
        await Promise.all(contexts.map((ctx) => ctx.watch()));
        console.log('👀 Watching...');
    } else {
        await buildAll();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
