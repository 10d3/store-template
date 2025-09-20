"use client";

import { Separator } from "@/components/ui/separator";
import { BlockquoteToolbar } from "@/components/toolbars/blockquote";
import { BoldToolbar } from "@/components/toolbars/bold";
import { BulletListToolbar } from "@/components/toolbars/bullet-list";
import { CodeToolbar } from "@/components/toolbars/code";
import { CodeBlockToolbar } from "@/components/toolbars/code-block";
import { HardBreakToolbar } from "@/components/toolbars/hard-break";
import { HorizontalRuleToolbar } from "@/components/toolbars/horizontal-rule";
import { ItalicToolbar } from "@/components/toolbars/italic";
import { OrderedListToolbar } from "@/components/toolbars/ordered-list";
import { RedoToolbar } from "@/components/toolbars/redo";
import { StrikeThroughToolbar } from "@/components/toolbars/strikethrough";
import { ToolbarProvider } from "@/components/toolbars/toolbar-provider";
import { UndoToolbar } from "@/components/toolbars/undo";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ImageExtension } from "./extensions/image";
import { ImagePlaceholder } from "./extensions/image-placeholder";
import { HeadingToolbar } from "./toolbars/heading";
import { ImagePlaceholderToolbar } from "./toolbars/image-placeholder-toolbar";
import { useUploadThing } from "@/lib/uploadthing";

export const Editor = ({
  content,
  onChange,
}: {
  content: string;
  onChange?: (content: string) => void;
  isReadOnly?: boolean;
}) => {
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      console.log(res);
      if (res && res.length > 0) {
        editor?.chain().focus().setImage({ src: res[0].ufsUrl }).run();
      }
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      alert(`ERROR! ${error.message}`);
    },
  });
  const extensions = [
    StarterKit.configure({
      orderedList: {
        HTMLAttributes: {
          class: "list-decimal",
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: "list-disc",
        },
      },
      code: {
        HTMLAttributes: {
          class: "bg-accent rounded-md p-1",
        },
      },
      horizontalRule: {
        HTMLAttributes: {
          class: "my-2",
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class:
            "bg-primary text-primary-foreground p-2 text-sm rounded-md p-1",
        },
      },
      heading: {
        levels: [1, 2, 3, 4],
        HTMLAttributes: {
          class: "tiptap-heading",
        },
      },
    }),
    ImageExtension,
    ImagePlaceholder.configure({
      onDrop: async (files) => {
        startUpload(files);
      },
    }),
  ];
  const editor = useEditor({
    extensions: extensions as Extension[],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  if (!editor) {
    return null;
  }
  return (
    <div className="border w-full relative rounded-md overflow-hidden pb-3">
      <div className="flex w-full items-center py-2 px-2 justify-between border-b  sticky top-0 left-0 bg-background z-20">
        <ToolbarProvider editor={editor}>
          <div className="flex items-center gap-2">
            <HeadingToolbar />
            <UndoToolbar />
            <RedoToolbar />
            <Separator orientation="vertical" className="h-7" />
            <BoldToolbar />
            <ItalicToolbar />
            <StrikeThroughToolbar />
            <BulletListToolbar />
            <OrderedListToolbar />
            <CodeToolbar />
            <CodeBlockToolbar />
            <HorizontalRuleToolbar />
            <BlockquoteToolbar />
            <HardBreakToolbar />
            <ImagePlaceholderToolbar />
          </div>
        </ToolbarProvider>
      </div>
      <div
        onClick={() => {
          editor?.chain().focus().run();
        }}
        className="cursor-text min-h-[18rem] bg-background"
      >
        <EditorContent className="outline-none" editor={editor} />
      </div>
    </div>
  );
};
