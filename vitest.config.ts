import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // TODO Tant qu'on ne fait pas manuellement : import { describe, test, expect } from 'vitest';
        environment: 'happy-dom',
        environmentOptions: {
            happyDOM: {
                settings: {
                    disableCSSFileLoading: true, // TODO désactiver les logs : DOMException [NotSupportedError]: Failed to load external stylesheet "[...]". CSS file loading is disabled.
                    disableJavaScriptFileLoading: true, // TODO désactiver les logs : DOMException [NotSupportedError]: Failed to load script "[...]". JavaScript file loading is disabled.
                    navigation: {
                        disableChildFrameNavigation: true,
                    },
                },
            },
        },
        reporters: [
            'default',
            'junit',
        ],
        coverage: {
            provider: 'v8',
            reporter: [
                'html',
                'text',
                'text-summary',
                'cobertura',
            ],
        },
        unstubGlobals: true,
    },
});
