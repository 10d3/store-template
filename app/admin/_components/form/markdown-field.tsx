"use client";

/* MarkdownField — a drop-in replacement for Textarea on markdown-backed
   fields (product description, nutrition details).

   - Toolbar inserts markdown at the cursor (native undo preserved via
     setRangeText-style splicing on the controlled value).
   - Write | Preview tabs. Preview serializes with next-mdx-remote and
     renders through the SAME component map as the storefront
     (components/shared/markdown-components.tsx), so what the admin sees
     is exactly what shoppers get.
   - Image button uploads via UploadThing (imageUploader) and inserts
     ![alt](url) at the cursor.
   - Snippets for the blocks product pages actually need: nutrition
     table, ingredients list, how-to-use steps.

   Compatible with react-hook-form: pass value/onChange/onBlur from the
   field (do NOT spread {...field} — this component doesn't take a ref). */

import { useCallback, useEffect, useRef, useState } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mdxComponents } from "@/components/shared/markdown-components";
import { UploadButton } from "@/lib/uploadthing";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  Code,
  Minus,
  Table,
  ImagePlus,
  Sparkles,
  Eye,
  PenLine,
} from "lucide-react";

interface MarkdownFieldProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

const SNIPPETS: Record<string, { label: string; markdown: string }> = {
  nutrition: {
    label: "Nutrition table",
    markdown: [
      "| Nutrient | Per Serving | % Daily Value |",
      "| --- | --- | --- |",
      "| Energy | — | — |",
      "| Protein | — | — |",
      "| Carbohydrates | — | — |",
      "| Fat | — | — |",
    ].join("\n"),
  },
  ingredients: {
    label: "Ingredients list",
    markdown: ["### Ingredients", "", "- **Ingredient one** — what it does", "- **Ingredient two** — what it does"].join(
      "\n"
    ),
  },
  steps: {
    label: "How-to-use steps",
    markdown: ["### How to Use", "", "1. Step one", "2. Step two", "3. Step three"].join("\n"),
  },
  table: {
    label: "Generic table",
    markdown: ["| Column A | Column B |", "| --- | --- |", "| Value | Value |"].join("\n"),
  },
};

export default function MarkdownField({
  value,
  onChange,
  onBlur,
  placeholder = "Write your content in Markdown…",
  helperText = "Markdown supported — **bold**, lists, tables, images. Use Preview to see exactly what shoppers will see.",
  className,
}: MarkdownFieldProps) {
  const text = value ?? "";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [debounced, setDebounced] = useState(text);
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);

  /* Debounce preview serialization so typing stays snappy. */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) {
      setMdxSource(null);
      return;
    }
    serialize(debounced)
      .then((result) => {
        if (!cancelled) setMdxSource(result);
      })
      .catch(() => {
        if (!cancelled) setMdxSource(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  /* Restore cursor position + focus after the controlled value updates. */
  const restoreCursor = useCallback((pos: number) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.selectionStart = el.selectionEnd = pos;
      el.focus();
    });
  }, []);

  const insertAtCursor = useCallback(
    (snippet: string, cursorOffsetFromEnd = 0) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      const next = text.slice(0, start) + snippet + text.slice(end);
      onChange(next);
      restoreCursor(start + snippet.length - cursorOffsetFromEnd);
    },
    [text, onChange, restoreCursor]
  );

  const insertBlock = useCallback(
    (block: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const needsLeadingNewlines = start > 0 && !text.slice(0, start).endsWith("\n\n");
      const padded = (needsLeadingNewlines ? "\n\n" : "") + block + "\n";
      insertAtCursor(padded);
    },
    [text, insertAtCursor]
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string, placeholderText = "text") => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      const selected = text.slice(start, end) || placeholderText;
      const next = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
      onChange(next);
      restoreCursor(start + prefix.length + selected.length);
    },
    [text, onChange, restoreCursor]
  );

  const toggleLinePrefix = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineEndIdx = text.indexOf("\n", end);
      const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
      const block = text.slice(lineStart, lineEnd);
      const lines = block.split("\n");
      const allPrefixed = lines.every((l) => l.startsWith(prefix));
      const nextBlock = lines
        .map((l, i) => {
          const ordered = prefix === "1. " ? `${i + 1}. ` : prefix;
          return allPrefixed ? l.slice(prefix.length) : ordered + l;
        })
        .join("\n");
      const next = text.slice(0, lineStart) + nextBlock + text.slice(lineEnd);
      onChange(next);
      restoreCursor(lineStart + nextBlock.length);
    },
    [text, onChange, restoreCursor]
  );

  const tools = [
    { icon: Bold, title: "Bold (**bold**)", action: () => wrapSelection("**", "**") },
    { icon: Italic, title: "Italic (*italic*)", action: () => wrapSelection("*", "*") },
    { icon: Heading2, title: "Heading", action: () => toggleLinePrefix("## ") },
    { icon: Heading3, title: "Subheading", action: () => toggleLinePrefix("### ") },
    { icon: List, title: "Bullet list", action: () => toggleLinePrefix("- ") },
    { icon: ListOrdered, title: "Numbered list", action: () => toggleLinePrefix("1. ") },
    { icon: Quote, title: "Quote", action: () => toggleLinePrefix("> ") },
    { icon: Code, title: "Inline code", action: () => wrapSelection("`", "`") },
    { icon: Link2, title: "Link [label](url)", action: () => wrapSelection("[", "](https://)", "label") },
    { icon: Minus, title: "Divider", action: () => insertBlock("---") },
  ] as const;

  const toolBtn =
    "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent shadow-none";

  return (
    <div className={`overflow-hidden rounded-lg border-2 bg-background transition-colors focus-within:border-primary ${className ?? ""}`}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1.5">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="write"
              className="h-8 gap-1.5 rounded-md px-2.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <PenLine className="h-3.5 w-3.5" /> Write
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="h-8 gap-1.5 rounded-md px-2.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </TabsTrigger>
          </TabsList>

          {tab === "write" && (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-0.5">
              {tools.map(({ icon: Icon, title, action }) => (
                <Button key={title} type="button" variant="outline" size="sm" className={toolBtn} title={title} onClick={action}>
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{title}</span>
                </Button>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className={`${toolBtn} w-auto gap-1 px-2`} title="Insert block">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden text-xs md:inline">Insert</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(SNIPPETS).map(([key, s]) => (
                    <DropdownMenuItem key={key} onClick={() => insertBlock(s.markdown)}>
                      <Table className="mr-2 h-4 w-4 text-muted-foreground" />
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <UploadButton
                endpoint="imageUploader"
                appearance={{
                  button: `${toolBtn} w-auto gap-1 px-2 h-8 text-xs font-normal cursor-pointer`,
                  allowedContent: "hidden",
                }}
                onClientUploadComplete={(res) => {
                  const url = res?.[0]?.ufsUrl;
                  if (url) insertAtCursor(`\n\n![Product image](${url})\n\n`);
                }}
                onUploadError={(error: Error) => {
                  console.error("Image upload failed:", error.message);
                }}
              />
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-0">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className="min-h-[220px] resize-y rounded-none border-0 shadow-none focus-visible:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="min-h-[220px] max-h-[420px] overflow-y-auto px-4 py-3">
            {mdxSource ? (
              <MDXRemote {...mdxSource} components={mdxComponents} />
            ) : (
              <p className="text-sm italic text-muted-foreground">Nothing to preview yet — start writing in the Write tab.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-1.5">
        <p className="text-xs text-muted-foreground">{helperText}</p>
        <span className="shrink-0 pl-3 text-xs tabular-nums text-muted-foreground">{text.length.toLocaleString()} chars</span>
      </div>
    </div>
  );
}
