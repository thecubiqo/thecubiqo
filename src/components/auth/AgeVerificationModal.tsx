'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AgeVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AgeVerificationModal({ isOpen, onClose, onSuccess }: AgeVerificationModalProps) {
    const { user, refreshProfile } = useAuth();
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('Please sign in to verify your age.');
            return;
        }
        if (!dob) {
            setError('Please enter your date of birth.');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                setError('You must be 18 or older to access this zone.');
                setIsLoading(false);
                return;
            }

            const supabase = createClient();
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    age_verified: true,
                    age_verified_at: new Date().toISOString(),
                    date_of_birth: dob
                } as any)
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            onSuccess();
        } catch (err: any) {
            console.error('Age verification failed:', err);
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Age Verification Required</h2>
                <p className="text-zinc-400 mb-6 text-sm relative z-10">
                    The RED zone contains adult themes and explicit content. You must be 18 or older to proceed.
                </p>

                {!user ? (
                    <div className="text-center relative z-10">
                        <p className="text-red-400 mb-4 font-medium">Please sign in to access the RED zone.</p>
                        <button
                            onClick={onClose}
                            className="px-6 flex w-full justify-center py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div>
                            <label htmlFor="dob" className="block text-sm text-zinc-400 mb-1">
                                Date of Birth
                            </label>
                            <input
                                id="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                required
                                max={new Date().toISOString().split('T')[0]} // Can't be future
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !dob}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Age'}
                            </button>
                        </div>

                        <p className="text-xs text-zinc-500 text-center mt-4">
                            Your date of birth will be securely stored in your profile.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
