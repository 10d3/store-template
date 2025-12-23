'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    // DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Check, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AffiliateStatus } from "@/lib/generated/prisma";
import { updateAffiliateStatus } from "@/lib/action/admin-affiliation";

interface Subscription {
    id: string;
    user: {
        name: string;
        email: string;
    };
    referralCode: string;
    status: string;
    tiktok: string | null;
    instagram: string | null;
    twitter: string | null;
    youtube: string | null;
    createdAt: Date;
}

export function AffiliateTable({ data }: { data: Subscription[] }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
    const [reason, setReason] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const openActionDialog = (id: string, actionType: "APPROVE" | "REJECT") => {
        setSelectedId(id);
        setAction(actionType);
        setReason("");
        setDialogOpen(true);
    };

    const handleAction = async () => {
        if (!selectedId || !action) return;

        startTransition(async () => {
            const status: AffiliateStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED";
            const result = await updateAffiliateStatus(selectedId, status, reason);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Affiliate ${action === "APPROVE" ? "approved" : "rejected"} successfully`);
                setDialogOpen(false);
            }
        });
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Socials</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                No affiliate applications found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((affiliate) => (
                            <TableRow key={affiliate.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{affiliate.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{affiliate.user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{affiliate.referralCode}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {affiliate.tiktok && (
                                            <Link href={affiliate.tiktok} target="_blank" className="text-xs bg-black text-white px-2 py-1 rounded hover:opacity-80">
                                                TikTok
                                            </Link>
                                        )}
                                        {affiliate.instagram && (
                                            <Link href={affiliate.instagram} target="_blank" className="text-xs bg-pink-600 text-white px-2 py-1 rounded hover:opacity-80">
                                                Insta
                                            </Link>
                                        )}
                                        {affiliate.youtube && (
                                            <Link href={affiliate.youtube} target="_blank" className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:opacity-80">
                                                YT
                                            </Link>
                                        )}
                                        {affiliate.twitter && (
                                            <Link href={affiliate.twitter} target="_blank" className="text-xs bg-blue-400 text-white px-2 py-1 rounded hover:opacity-80">
                                                X
                                            </Link>
                                        )}
                                        {!affiliate.tiktok && !affiliate.instagram && !affiliate.youtube && !affiliate.twitter && (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            affiliate.status === "ACTIVE" ? "default" :
                                                affiliate.status === "REJECTED" ? "destructive" : "secondary"
                                        }
                                    >
                                        {affiliate.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(affiliate.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>
                                                Copy Email
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {affiliate.status === "PENDING" && (
                                                <>
                                                    <DropdownMenuItem onClick={() => openActionDialog(affiliate.id, "APPROVE")}>
                                                        <Check className="mr-2 h-4 w-4" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openActionDialog(affiliate.id, "REJECT")}>
                                                        <X className="mr-2 h-4 w-4" /> Reject
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {affiliate.status === "ACTIVE" && (
                                                <DropdownMenuItem onClick={() => openActionDialog(affiliate.id, "REJECT")}>
                                                    Suspend/Reject
                                                </DropdownMenuItem>
                                            )}
                                            {affiliate.status === "REJECTED" && (
                                                <DropdownMenuItem onClick={() => openActionDialog(affiliate.id, "APPROVE")}>
                                                    Reactivate
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {action === "APPROVE" ? "Approve Application" : "Reject Application"}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {action?.toLowerCase()} this affiliate?
                            {action === "APPROVE" && " They will receive an email with dashboard access."}
                            {action === "REJECT" && " They will receive a rejection email."}
                        </DialogDescription>
                    </DialogHeader>

                    {action === "REJECT" && (
                        <div className="grid gap-2">
                            <label htmlFor="reason" className="text-sm font-medium">Rejection Reason (Optional)</label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Incomplete profile, not a good fit..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant={action === "REJECT" ? "destructive" : "default"}
                            onClick={handleAction}
                            disabled={isPending}
                        >
                            {isPending ? "Processing..." : action === "APPROVE" ? "Approve" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
