"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { submitSupportRequest } from "@/lib/action/support";

interface SupportFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export default function SupportPage() {
    const [formData, setFormData] = useState<SupportFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (
        field: keyof SupportFormData,
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitSupportRequest(formData);

            if (!result.success) {
                throw new Error(result.error);
            }

            setIsSubmitted(true);
            toast.success("Your message has been sent successfully!");
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            console.error("Error submitting support request:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <Card className="max-w-md mx-auto">
                        <CardContent className="pt-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                            <p className="text-muted-foreground mb-6">
                                Thank you for contacting us. You will receive a confirmation email and we will get back to you as soon as possible.
                            </p>
                            <Button onClick={() => setIsSubmitted(false)} variant="outline">
                                Send Another Message
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                    >
                        <MessageSquare className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Support</h1>
                    <p className="text-muted-foreground">
                        Have a question or need help? We&apos;re here to assist you.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Send us a Message
                        </CardTitle>
                        <CardDescription>
                            Fill out the form below and we&apos;ll respond within 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Your name"
                                        required
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2"
                            >
                                <Label htmlFor="subject" className="text-sm font-medium">
                                    Sujet
                                </Label>
                                <Input
                                    id="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => handleInputChange("subject", e.target.value)}
                                    placeholder="What is your inquiry about?"
                                    required
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-2"
                            >
                                <Label htmlFor="message" className="text-sm font-medium">
                                    Message
                                </Label>
                                <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => handleInputChange("message", e.target.value)}
                                    placeholder="Describe your issue or question in detail..."
                                    className="min-h-[150px] resize-none"
                                    required
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                    size="lg"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                            />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
