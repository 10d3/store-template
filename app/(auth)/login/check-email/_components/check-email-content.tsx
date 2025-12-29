"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContentInner() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Check your inbox</CardTitle>
                    <CardDescription className="text-base">
                        We&apos;ve sent a sign-in link to{" "}
                        {email && <strong className="text-foreground">{email}</strong>}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                        <p>📧 Click the link in the email to sign in</p>
                        <p>⏱️ The link expires in 15 minutes</p>
                        <p className="font-medium text-foreground">📁 Don&apos;t see the email? Check your spam or junk folder!</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Didn&apos;t receive the email?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Try again
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CheckEmailContent() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[80vh] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <CheckEmailContentInner />
        </Suspense>
    );
}
