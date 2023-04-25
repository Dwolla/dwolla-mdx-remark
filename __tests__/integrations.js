const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const spawn = require("cross-spawn");

describe("Integration Tests", () => {
    test("Basic", async () => {
        const fixture = path.join(__dirname, "fixtures/basic");
        const outPath = await compileNextJs(fixture);

        expectContentMatch(outPath, "index.html", /Hello, World!/)
        expectContentMatch(outPath, "docs/intro.html", /<p>LAYOUT TEMPLATE<\/p>/)
        expectContentMatch(outPath, "docs/intro.html", /<h1>Intro Docs<\/h1>/)
        expectContentMatch(outPath, "docs/intro.html", /some <em>introductory<\/em> docs content/)
        expectContentMatch(outPath, "docs/advanced.html", /<p>LAYOUT TEMPLATE<\/p>/)
        expectContentMatch(outPath, "docs/advanced.html", /<h1>Advanced Docs<\/h1>/)
    });

    test("Using __resourcePath frontmatter", async () => {
        const fixture = path.join(__dirname, "fixtures/resource-path");
        const outPath = await compileNextJs(fixture);

        expectContentMatch(outPath, "index.html", /<li>docs\/intro.mdx<\/li>/);
        expectContentMatch(outPath, "index.html", /<li>docs\/advanced.mdx<\/li>/);
        expectContentMatch(outPath, "docs/intro.html", /some <em>introductory<\/em> docs content/);
        expectContentMatch(outPath, "docs/advanced.html", /some <strong>advanced<\/strong> docs content/);
    });

    afterAll(() => {
        rimraf.sync(path.join(__dirname, "fixtures/*/.next"));
        rimraf.sync(path.join(__dirname, "fixtures/*/out"));
    });
});

async function compileNextJs(projectPath) {
    const nextLocal = path.join(__dirname, "../node_modules/.bin/next");

    spawn.sync(nextLocal, ["build", projectPath], {
        cwd: projectPath, stdio: "inherit"
    });
    return path.join(projectPath, "out");
}

function expectContentMatch(outPath, filePath, matcher) {
    const content = fs.readFileSync(path.join(outPath, filePath), "utf-8");
    return expect(content).toMatch(matcher);
}
