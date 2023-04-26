import debugInit from "debug";
import {glob} from "glob";
import matter from "gray-matter";
import path from "path";
import {valueToEstree} from "estree-util-value-to-estree";

const debug = debugInit("dwolla-mdx-remark");

const DEFAULT_LAYOUTS_DIR = "layouts";
const DEFAULT_LAYOUTS_FILE = "index";

async function fileExists(path) {
    debug("Checking if file exists at following path: ", path);
    const files = await glob(path);
    return files.length !== 0;
}

function normalizeToUnixPath(str) {
    return str.replace(/\\/g, "/");
}

/**
 * This MDX plugin performs the following functions:
 *  1. Extracts frontmatter from MDXAST, stringifies, and injects it back as `frontMatter` variable
 *  2. Determines if a layout should be used and if so, injects the layout
 *
 * For more information regarding MDXAST, please see here:
 * https://github.com/mdx-js/specification#mdxast
 */
export default () => async (tree, file) => {
    // Extract the resource path for this specific file for injection. Used because of legacy
    // dependency on `next-mdx-enhanced`: https://github.com/hashicorp/next-mdx-enhanced/blob/main/index.js#L118-L120
    const resourcePath = file.history[0]
        .replace(path.join(file.cwd, "pages"), "")
        .substring(1);
    debug("Processing file: ", resourcePath);

    // Since this package is pure ESM, it must be imported asynchronously within the
    // function and cannot be imported at the top of the script file.
    let {data: frontMatter} = matter(file.value);
    frontMatter = {...frontMatter, __resourcePath: resourcePath};
    debug("Extracted following frontmatter: ", frontMatter);

    // Export the frontmatter variable to the AST
    tree.children.push({
        type: "mdxjsEsm",
        data: {
            estree: {
                type: "Program",
                sourceType: "module",
                body: [
                    {
                        type: "ExportNamedDeclaration",
                        specifiers: [],
                        declaration: {
                            type: "VariableDeclaration",
                            kind: "const",
                            declarations: [
                                {
                                    type: "VariableDeclarator",
                                    id: {type: "Identifier", name: "frontMatter"},
                                    init: valueToEstree(frontMatter)
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // Remove the frontmatter node from the AST, because it has already
    // been processed and exported above.
    if (tree.children[0].type === "thematicBreak") {
        const firstHeadingIndex = tree.children.findIndex(
            (t) => t.type === "heading"
        );

        if (firstHeadingIndex !== -1) {
            tree.children.splice(0, firstHeadingIndex + 1);
        }
    }

    // On some pages (e.g., the home page), don't export any layout, since the
    // MDX file already includes a default export by itself.
    if (!frontMatter.noDefaultLayout) {
        // Determine if the layout that should be used, if any
        const layoutPath = path.resolve(
            file.cwd,
            DEFAULT_LAYOUTS_DIR,
            frontMatter.layout || DEFAULT_LAYOUTS_FILE
        );

        // Confirm that the layout exists - if it doesn't, don't inject
        if (await fileExists(`${layoutPath}.*(js|jsx|ts|tsx)`)) {
            // Import our layout in the AST
            tree.children.push({
                type: "mdxjsEsm",
                data: {
                    estree: {
                        type: "Program",
                        sourceType: "module",
                        body: [
                            {
                                type: "ImportDeclaration",
                                specifiers: [
                                    {
                                        type: "ImportDefaultSpecifier",
                                        local: {
                                            type: "Identifier",
                                            name: "Layout"
                                        }
                                    }
                                ],
                                source: valueToEstree(normalizeToUnixPath(layoutPath))
                            }
                        ]
                    }
                }
            });

            // Add our default export for the layout we're using.
            // This behavior should mimic https://nextjs.org/docs/advanced-features/using-mdx#layouts
            tree.children.push({
                type: "mdxjsEsm",
                data: {
                    estree: {
                        type: "Program",
                        sourceType: "module",
                        body: [
                            {
                                type: "ExportDefaultDeclaration",
                                declaration: {
                                    type: "ArrowFunctionExpression",
                                    expression: true,
                                    params: [
                                        {
                                            type: "ObjectPattern",
                                            properties: [
                                                {
                                                    type: "Property",
                                                    key: {
                                                        type: "Identifier",
                                                        name: "children"
                                                    },
                                                    kind: "init",
                                                    value: {
                                                        type: "Identifier",
                                                        name: "children"
                                                    }
                                                }
                                            ]
                                        }
                                    ],
                                    body: {
                                        type: "JSXElement",
                                        openingElement: {
                                            type: "JSXOpeningElement",
                                            attributes: [
                                                {
                                                    type: "JSXAttribute",
                                                    name: {
                                                        type: "JSXIdentifier",
                                                        name: "frontMatter"
                                                    },
                                                    value: {
                                                        type: "JSXExpressionContainer",
                                                        expression: {
                                                            type: "Identifier",
                                                            name: "frontMatter"
                                                        }
                                                    }
                                                }
                                            ],
                                            name: {
                                                type: "JSXIdentifier",
                                                name: "Layout"
                                            }
                                        },
                                        closingElement: {
                                            type: "JSXClosingElement",
                                            name: {
                                                type: "JSXIdentifier",
                                                name: "Layout"
                                            }
                                        },
                                        children: [
                                            {
                                                type: "JSXExpressionContainer",
                                                expression: {
                                                    type: "Identifier",
                                                    name: "children"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            });
        }
    }
};
