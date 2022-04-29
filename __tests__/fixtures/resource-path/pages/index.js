import { frontMatter as introData } from "./docs/intro.mdx";
import { frontMatter as advancedData } from "./docs/advanced.mdx";

export default function Home() {
    return (
        <>
            <p>Hello, World!</p>
            <ul>
                <li>{ introData.__resourcePath }</li>
                <li>{ advancedData.__resourcePath }</li>
            </ul>
        </>
    );
}