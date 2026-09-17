import Link from "next/link";
import Image from "next/image";

/* Shared MDX component map — single source of truth for how markdown
   renders across the app. Used by:
   - components/shared/markdown.tsx (storefront, RSC)
   - app/admin/_components/form/markdown-field.tsx (admin live preview)
   Keeping it in one place guarantees the admin preview is pixel-identical
   to production output. All colors come from design tokens so markdown
   melts into the page and follows light/dark automatically. */

const headingBase = "font-semibold tracking-tight text-foreground";
const textBase = "leading-7 text-foreground/90";

const isExternal = (href?: string) => !!href && /^(https?:)?\/\//.test(href);

const linkClass =
  "font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary";

export const mdxComponents = {
  /* Links — external links open in a new tab (next/link would try to
     client-route them and 404). Brand-colored, refined underline. */
  a: ({ href, children, ...props }: React.ComponentProps<"a">) =>
    isExternal(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} {...props}>
        {children}
      </a>
    ) : (
      <Link href={href ?? "#"} className={linkClass} {...props}>
        {children}
      </Link>
    ),

  /* Headings — scoped BELOW page-level headings (page sections are
     text-2xl) so markdown never outranks the page's own hierarchy. */
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={`mt-8 mb-4 scroll-mt-24 text-2xl md:text-3xl ${headingBase}`} {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={`mt-8 mb-3 scroll-mt-24 text-xl md:text-2xl ${headingBase}`} {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={`mt-6 mb-2 scroll-mt-24 text-lg md:text-xl ${headingBase}`} {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={`mt-5 mb-2 text-base ${headingBase}`} {...props} />
  ),

  /* Paragraphs — first paragraph gets no top gap so it sits flush
     under the card title. */
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={`mb-4 [&:first-child]:mt-0 ${textBase}`} {...props} />
  ),

  /* Lists — markers outside, muted, comfortable rhythm. */
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-5 marker:text-muted-foreground/70" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="mb-4 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-muted-foreground/70"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className={`pl-1 ${textBase}`} {...props} />,

  /* Strong / emphasis — subtle weight shift, no color noise. */
  strong: (props: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props: React.HTMLAttributes<HTMLElement>) => <em className="italic" {...props} />,

  /* Images — rounded, bordered, shadow-sm; height auto preserves the
     intrinsic ratio (no forced 16:9 distortion). */
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <span className="my-6 block overflow-hidden rounded-xl border bg-muted shadow-sm">
      <Image
        src={src || ""}
        alt={alt || ""}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 60vw"
        className="h-auto w-full"
      />
    </span>
  ),

  /* Tables — spec/supplement sheets get a real card: scrollable,
     bordered, zebra rows, uppercase headers. */
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="bg-muted/60" {...props} />,
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b px-4 py-2.5 align-top last:border-b-0 [&:nth-child(odd)]:bg-transparent" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="transition-colors even:bg-muted/30 hover:bg-muted/50" {...props} />
  ),

  /* Blockquote — quiet callout, tinted with the primary accent. */
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 rounded-r-lg border-l-2 border-primary/40 bg-muted/40 px-4 py-3 italic text-muted-foreground [&>p]:mb-0"
      {...props}
    />
  ),

  /* Horizontal rule — soft fade instead of a hard line. */
  hr: () => (
    <div aria-hidden="true" className="my-8 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
  ),

  /* Inline code. */
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground" {...props} />
  ),

  br: () => <br />,
};
