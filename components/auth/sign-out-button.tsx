"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        const { error } = await authClient.signOut();
        if (error) {
          toast.error(error.message ?? "Could not sign out");
          return;
        }
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
