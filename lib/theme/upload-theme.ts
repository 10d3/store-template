import type { CSSProperties } from "react";

type CallbackArguments = {
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

type StyleField =
  | string
  | CSSProperties
  | ((args: CallbackArguments) => string | CSSProperties);

type UploadButtonProps = {
  appearance?: {
    container?: StyleField;
    button?: StyleField;
    allowedContent?: StyleField;
  };
};

type UploadDropzoneProps = {
  appearance?: {
    container?: StyleField;
    uploadIcon?: StyleField;
    label?: StyleField;
    allowedContent?: StyleField;
    button?: StyleField;
  };
};

// Default shadcn theme
export const defaultTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-2",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
    allowedContent: "text-xs text-muted-foreground mt-2",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        ready
          ? "border-muted-foreground/25 hover:border-muted-foreground/50"
          : "border-muted-foreground/10"
      } ${isUploading ? "border-primary bg-primary/5" : ""}`,
    uploadIcon: "mx-auto h-12 w-12 text-muted-foreground mb-4",
    label: "text-lg font-semibold text-foreground mb-2",
    allowedContent: "text-sm text-muted-foreground mb-4",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Minimal theme
export const minimalTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-1",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
    allowedContent: "text-xs text-muted-foreground",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border border-dashed rounded-md p-6 text-center transition-colors ${
        ready ? "border-border hover:border-border/80" : "border-border/50"
      } ${isUploading ? "border-primary/50 bg-primary/5" : ""}`,
    uploadIcon: "mx-auto h-8 w-8 text-muted-foreground/70 mb-3",
    label: "text-base font-medium text-foreground mb-1",
    allowedContent: "text-xs text-muted-foreground mb-3",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Modern theme with gradients
export const modernTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-3",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl h-11 px-6 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75 animate-pulse" : ""}`,
    allowedContent:
      "text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${
        ready
          ? "border-primary/30 hover:border-primary/50 hover:bg-primary/5"
          : "border-muted-foreground/20"
      } ${isUploading ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner" : ""}`,
    uploadIcon: "mx-auto h-16 w-16 text-primary/70 mb-6",
    label:
      "text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-3",
    allowedContent:
      "text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full inline-block mb-6",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl h-11 px-6 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75 animate-pulse" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Dark theme
export const darkTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-2",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-50 text-slate-900 hover:bg-slate-50/90 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-900/90 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
    allowedContent: "text-xs text-slate-500 dark:text-slate-400 mt-2",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-900/50 ${
        ready
          ? "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
          : "border-slate-200 dark:border-slate-800"
      } ${isUploading ? "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800" : ""}`,
    uploadIcon: "mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4",
    label: "text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2",
    allowedContent: "text-sm text-slate-600 dark:text-slate-400 mb-4",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Colorful theme
export const colorfulTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-3",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 h-12 px-8 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75 animate-bounce" : ""}`,
    allowedContent:
      "text-xs text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-200",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 bg-gradient-to-br from-violet-50 to-purple-50 ${
        ready
          ? "border-violet-300 hover:border-violet-400 hover:from-violet-100 hover:to-purple-100"
          : "border-violet-200"
      } ${isUploading ? "border-violet-500 from-violet-200 to-purple-200 animate-pulse" : ""}`,
    uploadIcon: "mx-auto h-20 w-20 text-violet-500 mb-6 animate-bounce",
    label:
      "text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4",
    allowedContent:
      "text-sm text-violet-600 bg-white/80 px-4 py-2 rounded-full border border-violet-200 inline-block mb-8",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 h-12 px-8 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75 animate-bounce" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Subtle theme
export const subtleTheme = {
  uploadButton: {
    container: "flex flex-col items-center gap-2",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
    allowedContent: "text-xs text-muted-foreground/80 mt-1",
  } satisfies UploadButtonProps["appearance"],

  uploadDropzone: {
    container: ({ ready, isUploading }: CallbackArguments) =>
      `border border-dashed rounded-lg p-8 text-center transition-colors bg-secondary/20 ${
        ready
          ? "border-secondary hover:border-secondary/80 hover:bg-secondary/30"
          : "border-secondary/50"
      } ${isUploading ? "border-secondary bg-secondary/40" : ""}`,
    uploadIcon: "mx-auto h-10 w-10 text-secondary-foreground/60 mb-4",
    label: "text-lg font-medium text-secondary-foreground mb-2",
    allowedContent: "text-sm text-muted-foreground/80 mb-4",
    button: ({ ready, isUploading }: CallbackArguments) =>
      `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 ${
        !ready ? "opacity-50 cursor-not-allowed" : ""
      } ${isUploading ? "opacity-75" : ""}`,
  } satisfies UploadDropzoneProps["appearance"],
};

// Export all themes
export const uploadThemes = {
  default: defaultTheme,
  minimal: minimalTheme,
  modern: modernTheme,
  dark: darkTheme,
  colorful: colorfulTheme,
  subtle: subtleTheme,
};

// Type exports for convenience
export type {
  UploadButtonProps,
  UploadDropzoneProps,
  StyleField,
  CallbackArguments,
};
