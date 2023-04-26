import debugInit from "debug";
import remarkPlugin from "./remark-plugin.js";
import {createRequire} from "node:module";

const debug = debugInit("dwolla-mdx-remark");

/**
 * `createRequire` is used in this context because at the time of writing, Node's `import.meta.resolve`
 * function is still experimental. If the function ever becomes stable, however, that should be used instead.
 *
 * @see https://nodejs.org/api/esm.html#importmetaresolvespecifier-parent}
 */
const require = createRequire(import.meta.url);

export default (pluginOptions = {}) => (nextConfig = {}) => ({
    ...nextConfig,
    pageExtensions: Array.from(
        new Set([...(nextConfig.pageExtensions || []), "md", "mdx"])
    ),
    webpack(config, options) {
        const expandedRemarkPlugins = [...(pluginOptions?.options?.remarkPlugins || []), remarkPlugin];
        const expandedOptions = {...pluginOptions?.options, remarkPlugins: expandedRemarkPlugins};
        debug("Using Expanded Options: ", expandedOptions);

        config.module.rules.push({
            test: pluginOptions.extension || /\.mdx?$/,
            use: [
                options.defaultLoaders.babel,
                {
                    loader: require.resolve("@mdx-js/loader"),
                    options: expandedOptions
                }
            ]
        });

        if (typeof nextConfig.webpack === "function") {
            return nextConfig.webpack(config, options);
        }
        return config;
    }
});
