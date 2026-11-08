"use client";

import { useRef } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { ourFileRouter } from "@/app/api/uploadthing/core";
import { toast } from "sonner";

const { useUploadThing } = generateReactHelpers<typeof ourFileRouter>();

export function ImageUploader({
  onUploaded,
  label = "Upload images",
}: {
  onUploaded: (urls: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (files) => {
      const urls = files.map((file) => file.ufsUrl);
      if (urls.length > 0) {
        onUploaded(urls);
        toast.success(
          `${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`
        );
      }
    },
    onUploadError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) await startUpload(files);
        }}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : label}
      </button>
    </>
  );
}
