import "server-only";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import Image from "next/image";

// Define custom MDX components
const mdxComponents = {
  // Custom styling for links using Next.js Link
  a: (props: React.ComponentProps<typeof Link>) => (
    <Link {...props} className="text-blue-500 hover:underline" />
  ),
  // Headings with improved styling
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="mt-8 mb-4 text-4xl font-bold text-center"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-6 mb-3 text-3xl font-semibold" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-5 mb-2 text-2xl font-medium" {...props} />
  ),
  // Paragraphs with proper spacing
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-relaxed" {...props} />
  ),
  // Lists with better spacing
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside space-y-2" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside space-y-2" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="ml-4" {...props} />
  ),
  img: (props: React.HTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
  // Line breaks for better text formatting
  br: () => <br className="my-2" />,
};

export const Markdown = async ({ source }: { source: string }) => {
  return <MDXRemote source={source} components={mdxComponents} />;
};
