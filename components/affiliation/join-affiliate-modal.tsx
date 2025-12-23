'use client';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinAffiliateProgram } from "@/lib/action/affiliation";

export function JoinAffiliateModal({
    children,
    userEmail,
}: {
    children: React.ReactNode;
    userEmail?: string;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await joinAffiliateProgram({}, formData);

            if (result.error) {
                toast.error(result.error);
            } else if (result.success) {
                toast.success("Application submitted successfully! Please wait for approval.");
                setOpen(false);
                router.refresh();
            }
        });
    };

    if (!userEmail) {
        // If no email (not logged in), we might want to redirect to login instead of showing the modal
        // But button that triggers this should probably handle that redirect logic OR this component handles it.
        // For now, assume this is only shown to logged in users or handles login redirect elsewhere.
        // Actually, let's just render the trigger and if they click and aren't logged in (caught by parent or action),
        // we can handle it. BUT simpler is to let the parent handle the "Join" button state (login vs modal).
        return <>{children}</>;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join Affiliate Program</DialogTitle>
                    <DialogDescription>
                        Join our affiliate program to earn commissions on every sale you refer.
                        Applications are subject to manual approval.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <DialogDescription className="mb-2">
                            Please provide links to your social media profiles where you plan to promote our products.
                        </DialogDescription>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tiktok" className="text-right">
                                TikTok
                            </Label>
                            <Input
                                id="tiktok"
                                name="tiktok"
                                placeholder="https://tiktok.com/@yourusername"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="instagram" className="text-right">
                                Instagram
                            </Label>
                            <Input
                                id="instagram"
                                name="instagram"
                                placeholder="https://instagram.com/yourusername"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="youtube" className="text-right">
                                YouTube
                            </Label>
                            <Input
                                id="youtube"
                                name="youtube"
                                placeholder="Channel URL"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="twitter" className="text-right">
                                Twitter/X
                            </Label>
                            <Input
                                id="twitter"
                                name="twitter"
                                placeholder="@yourhandle"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
