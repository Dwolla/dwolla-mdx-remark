import { frontMatter as introData } from "../pages/docs/intro.mdx";
import { frontMatter as advancedData } from "../pages/docs/advanced.mdx";

export default function PageLayout({ children, frontMatter }) {
    return (
        <>
            <p>LAYOUT TEMPLATE</p>
            <h1>{ frontMatter.title }</h1>
            <p>
                Other Docs: { introData.title }, { advancedData.title }
            </p>
            { children }
        </>
    );
}