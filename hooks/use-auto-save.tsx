import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
import { saveToDB } from "@/lib/save-to-db";
import useDebounce from "./use-auto-save-debounce";
import { Blog } from "@/lib/generated/prisma";
import { transformTitletoSlug } from "@/lib/utils";

export default function useAutoSave(blogData: Blog) {
  const searchParams = useSearchParams();
  const id = searchParams.get("transcreationId")!;

  const debounceSegments = useDebounce(blogData, 1500);

  const [blogId, setBlogId] = useState(blogData?.id as string);

  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsError(false);
  }, [debounceSegments]);

  const [lastSaveData, setLastSaveData] = useState(structuredClone(blogData));

  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    async function save() {
      try {
        setIsSaving(true);
        setIsError(false);
        const newData = structuredClone(debounceSegments);
        const updateData = await saveToDB({
          id: blogId,
          title: newData.title,
          slug: transformTitletoSlug(newData.title),
          coverImage: newData.coverImage,
          content: newData.content,
          seoTitle : newData.seoTitle,
          seoDescription: newData.seoDescription,
          authorId: newData.authorId,
        });
        console.log(updateData)
        setBlogId(updateData?.id as string);
        setLastSaveData(newData);

        // Preserve all existing URL parameters when updating
        if (searchParams.get("blogId") !== updateData?.id) {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set("blogId", updateData?.id as string);

          // Preserve the step parameter if it exists
          const currentStep = searchParams.get("step");
          if (currentStep) {
            newSearchParams.set("step", currentStep);
          }

          // Use replaceState instead of pushState to avoid adding to browser history
          window.history.replaceState(
            null,
            "",
            `?${newSearchParams.toString()}`
          );
        }
      } catch (error) {
        setIsError(true);
        console.error(error);
        // const { dismiss } = toast({
        //   variant: "destructive",
        //   description: (
        //     <div className="space-y-3 ">
        //       <Heading as="p">Could not save change</Heading>
        //       <Button
        //         variant="secondary"
        //         onClick={() => {
        //           dismiss();
        //           save();
        //         }}
        //       >
        //         Retry
        //       </Button>
        //     </div>
        //   ),
        // });
      } finally {
        setIsSaving(false);
      }
    }

    const hasUnsavedChanges =
      JSON.stringify(debounceSegments) !== JSON.stringify(lastSaveData);

    if (hasUnsavedChanges && debounceSegments && !isSaving && !isError) {
      save();
    }
  }, [
    debounceSegments,
    isSaving,
    lastSaveData,
    isError,
    blogId,
    searchParams,
    // toast,
  ]);

  return {
    isSaving,
    id,
    hasUnsavedChanges:
      JSON.stringify(blogData) !== JSON.stringify(lastSaveData),
  };
}
