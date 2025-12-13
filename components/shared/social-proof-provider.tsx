"use client";

import { useState, useEffect, useCallback } from "react";
import SocialProofNotification from "./social-proof-notification";
import { generateMockPurchase, type MockPurchase } from "@/lib/social-proof-data";

interface SocialProofProviderProps {
    // Products to randomly feature in notifications
    products?: { name: string; image: string }[];
    // Toggle feature on/off
    enabled?: boolean;
    // Position of notification
    position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
    // Minimum interval between notifications (ms)
    intervalMin?: number;
    // Maximum interval between notifications (ms)
    intervalMax?: number;
    // How long each notification is visible (ms)
    notificationDuration?: number;
    // Initial delay before first notification (ms)
    initialDelay?: number;
    // Show on mobile devices
    showOnMobile?: boolean;
}

export default function SocialProofProvider({
    products = [],
    enabled = true,
    position = "bottom-left",
    intervalMin = 2000, // 2 seconds
    intervalMax = 50000, // 50 seconds
    notificationDuration = 5000, // 5 seconds
    initialDelay = 10000, // 10 seconds
    showOnMobile = true,
}: SocialProofProviderProps) {
    const [currentPurchase, setCurrentPurchase] = useState<MockPurchase | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Generate random interval
    const getRandomInterval = useCallback(() => {
        return Math.floor(Math.random() * (intervalMax - intervalMin)) + intervalMin;
    }, [intervalMin, intervalMax]);

    // Show a notification
    const showNotification = useCallback(() => {
        const purchase = generateMockPurchase(products);
        setCurrentPurchase(purchase);
        setIsVisible(true);

        // Auto-hide after duration
        setTimeout(() => {
            setIsVisible(false);
        }, notificationDuration);
    }, [products, notificationDuration]);

    // Handle close
    const handleClose = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Main notification loop
    useEffect(() => {
        if (!enabled) return;
        if (!showOnMobile && isMobile) return;

        // Initial delay before first notification
        const initialTimer = setTimeout(() => {
            showNotification();
        }, initialDelay);

        // Set up recurring notifications
        let intervalId: NodeJS.Timeout;

        const scheduleNext = () => {
            const nextInterval = getRandomInterval();
            intervalId = setTimeout(() => {
                showNotification();
                scheduleNext();
            }, nextInterval);
        };

        // Start the loop after initial notification
        const loopStartTimer = setTimeout(() => {
            scheduleNext();
        }, initialDelay + notificationDuration);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(loopStartTimer);
            if (intervalId) clearTimeout(intervalId);
        };
    }, [enabled, showOnMobile, isMobile, initialDelay, notificationDuration, getRandomInterval, showNotification]);

    // Don't render if disabled or hidden on mobile
    if (!enabled) return null;
    if (!showOnMobile && isMobile) return null;

    return (
        <SocialProofNotification
            purchase={currentPurchase}
            isVisible={isVisible}
            onClose={handleClose}
            position={position}
        />
    );
}
