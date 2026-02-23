'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cubiqo-cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cubiqo-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cubiqo-cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md text-white p-4 animate-slide-in-up">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-sm text-zinc-300">
                    <p className="font-semibold text-white mb-1">🍪 We value your privacy</p>
                    We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies according to our{' '}
                    <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>
                    {' '}and{' '}
                    <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a>.
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <Button variant="ghost" onClick={handleDecline} className="flex-1 md:flex-none">
                        Decline
                    </Button>
                    <Button onClick={handleAccept} className="flex-1 md:flex-none">
                        Accept All
                    </Button>
                </div>
            </div>
        </div>
    );
}
