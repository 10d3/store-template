import "server-only";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "./markdown-components";

export const Markdown = async ({ source }: { source: string }) => {
  return <MDXRemote source={source} components={mdxComponents} />;
};
