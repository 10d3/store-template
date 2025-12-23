import { auth } from "@/lib/auth";
import { type Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { JoinAffiliateModal } from "@/components/affiliation/join-affiliate-modal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Affiliate Program | Vitanou Store",
    description: "Join the Vitanou Store affiliate program and earn commissions.",
};

export default async function AffiliateProgramPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const user = session?.user;
    let isAffiliate = false;
    let affiliateStatus = null;

    if (user) {
        const affiliate = await prisma.affiliate.findUnique({
            where: { userId: user.id },
        });
        if (affiliate) {
            isAffiliate = true;
            affiliateStatus = affiliate.status;
        }
    }

    // If already active affiliate, maybe redirect to dashboard?
    // Or show a "Go to Dashboard" button.
    if (isAffiliate && affiliateStatus === "ACTIVE") {
        // Optional: redirect("/affiliation"); 
    }

    const benefits = [
        "Earn 10% commission on every sale.",
        "Get paid directly to your PayPal or Bank Account.",
        "Real-time tracking dashboard.",
        "Exclusive promotions for your audience.",
        "30-day cookie duration.",
        "Dedicated support team.",
    ];

    return (
        <div className="container py-12 md:py-24 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Partner with <span className="text-primary">Vitanou</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join our affiliate program and earn commissions by sharing the products you love.
                    Start earning today with our competitive rewards.
                </p>

                <div className="flex justify-center gap-4">
                    {isAffiliate ? (
                        affiliateStatus === "ACTIVE" ? (
                            <Button size="lg" asChild>
                                <Link href="/affiliation">Go to Dashboard</Link>
                            </Button>
                        ) : (
                            <Button size="lg" variant="secondary" disabled>
                                Application {affiliateStatus}
                            </Button>
                        )
                    ) : user ? (
                        <JoinAffiliateModal userEmail={user.email}>
                            <Button size="lg" className="px-8">
                                Apply Now
                            </Button>
                        </JoinAffiliateModal>
                    ) : (
                        <Button size="lg" asChild>
                            <Link href="/login?callbackUrl=/affiliate-program">
                                Sign in to Apply
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold">Why Join?</h2>
                    <ul className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <CheckCheck className="h-4 w-4" />
                                </div>
                                <span className="text-lg">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-muted rounded-2xl p-8 space-y-4">
                    <h3 className="text-xl font-bold">How it works</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="font-bold text-4xl text-primary/40">1</div>
                            <div>
                                <h4 className="font-semibold">Sign Up</h4>
                                <p className="text-muted-foreground">Detailed registration process. Quick approval.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="font-bold text-4xl text-primary/40">2</div>
                            <div>
                                <h4 className="font-semibold">Promote</h4>
                                <p className="text-muted-foreground">Share your unique link or code with your audience.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="font-bold text-4xl text-primary/40">3</div>
                            <div>
                                <h4 className="font-semibold">Earn</h4>
                                <p className="text-muted-foreground">Get paid for every qualifying purchase made.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
