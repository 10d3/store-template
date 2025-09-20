"use client";
import { Editor } from "@/components/editor";
import { Input } from "@/components/ui/input";
import useAutoSave from "@/hooks/use-auto-save";
import useUnloadingWarning from "@/hooks/use-unloading-warning";
import type { Blog } from "@/lib/generated/prisma";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";

export default function BlogEditor({ blogData }: { blogData: Blog }) {
  const [blogDataS, setBlogDataS] = useState(blogData);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSeoTitle, setIsEditingSeoTitle] = useState(false);
  const [isEditingSeoDescription, setIsEditingSeoDescription] = useState(false);
  const seoTitleInputRef = useRef<HTMLInputElement>(null);
  const seoDescriptionInputRef = useRef<HTMLTextAreaElement>(null); // Use textarea for description
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { isSaving, hasUnsavedChanges, id } = useAutoSave(blogDataS);
  useUnloadingWarning(hasUnsavedChanges);

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
    if (isEditingSeoTitle && seoTitleInputRef.current) {
      seoTitleInputRef.current.focus();
      seoTitleInputRef.current.select();
    }
    if (isEditingSeoDescription && seoDescriptionInputRef.current) {
      seoDescriptionInputRef.current.focus();
      seoDescriptionInputRef.current.select();
    }
  }, [isEditingTitle, isEditingSeoTitle, isEditingSeoDescription]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setBlogDataS((prev) => ({
      ...prev,
      title: newTitle,
    }));
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleSeoTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeoTitle = e.target.value;
    setBlogDataS((prev) => ({
      ...prev,
      seoTitle: newSeoTitle,
    }));
  };

  const handleSeoTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditingSeoTitle(false);
    }
  };

  const handleSeoTitleBlur = () => {
    setIsEditingSeoTitle(false);
  };

  const handleSeoDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newSeoDescription = e.target.value;
    setBlogDataS((prev) => ({
      ...prev,
      seoDescription: newSeoDescription,
    }));
  };

  const handleSeoDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditingSeoDescription(false);
    }
  };

  const handleSeoDescriptionBlur = () => {
    setIsEditingSeoDescription(false);
  };

  const handleContentChange = (content: string) => {
    setBlogDataS((prev) => ({
      ...prev,
      content: content,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl md:px-4 py-8 sm:px-0 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : hasUnsavedChanges ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Save className="h-4 w-4" />
                <span>All changes saved</span>
              </div>
            )}
          </div>
          {id && (
            <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              ID: {id}
            </div>
          )}
        </div>

        <div className="mb-12">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={blogDataS.title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              className="border-0 bg-transparent px-0 py-0 text-4xl font-bold leading-tight focus-visible:ring-0 focus-visible:ring-offset-0 md:text-5xl"
              placeholder="Enter your blog title..."
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer text-4xl font-bold leading-tight text-foreground transition-colors hover:text-primary md:text-5xl"
              title={blogDataS.title || "Click to edit title"}
            >
              {blogDataS.title || (
                <span className="text-muted-foreground">Untitled Blog</span>
              )}
            </h1>
          )}
        </div>

        <div className="mb-12">
          <div className="rounded-lg border border-border bg-card">
            <div className="md:p-6">
              <Editor
                content={blogDataS.content || ""}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className=" flex flex-row justify-around">
            <div className="mb-6 w-1/2 pr-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Title
              </label>
              {isEditingSeoTitle ? (
                <Input
                  ref={seoTitleInputRef}
                  value={blogDataS.seoTitle || ""}
                  onChange={handleSeoTitleChange}
                  onKeyDown={handleSeoTitleKeyDown}
                  onBlur={handleSeoTitleBlur}
                  className="border-0 bg-transparent px-0 py-0 text-xl font-semibold leading-tight focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Enter SEO Title..."
                />
              ) : (
                <h2
                  onClick={() => setIsEditingSeoTitle(true)}
                  className="cursor-pointer text-xl font-semibold leading-tight text-foreground transition-colors hover:text-primary"
                  title={blogDataS.seoTitle || "Click to edit SEO title"}
                >
                  {blogDataS.seoTitle || (
                    <span className="text-muted-foreground">No SEO Title</span>
                  )}
                </h2>
              )}
            </div>
            <div className="mb-6 w-1/2 pl-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Description
              </label>
              {isEditingSeoDescription ? (
                <textarea
                  ref={seoDescriptionInputRef}
                  value={blogDataS.seoDescription || ""}
                  onChange={handleSeoDescriptionChange}
                  onKeyDown={handleSeoDescriptionKeyDown}
                  onBlur={handleSeoDescriptionBlur}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter SEO Description..."
                />
              ) : (
                <p
                  onClick={() => setIsEditingSeoDescription(true)}
                  className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary"
                  title={
                    blogDataS.seoDescription || "Click to edit SEO description"
                  }
                >
                  {blogDataS.seoDescription || (
                    <span className="text-muted-foreground">
                      No SEO Description
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Created:</span>
                <time className="font-mono">
                  {new Date(blogData.createdAt).toLocaleDateString()}
                </time>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Last updated:</span>
              <time className="font-mono">
                {new Date(blogDataS.updatedAt).toLocaleDateString()}
              </time>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
