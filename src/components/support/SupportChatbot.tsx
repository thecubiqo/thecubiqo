'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Navigation, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';

export function SupportChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
        { role: 'bot', text: 'Greetings! I am CUBIQO Support. How can I assist your journey today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue('');

        // Simulate AI Response
        setTimeout(() => {
            let botResponse = "I have noted your request. Would you like me to notify the Admin directly?";

            if (userMsg.toLowerCase().includes('navigate')) {
                botResponse = "I can guide you. Try the 'Business Vitals' tab in Codexo or the 'Security' panel in Admin.";
            } else if (userMsg.toLowerCase().includes('hello')) {
                botResponse = "Hello! I am here to help you navigate CUBIQO's multiple dimensions.";
            }

            setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4"
                    >
                        <Card className="w-80 md:w-96 h-[500px] border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden text-white">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-bold tracking-tight">CUBIQO Support Hub</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="hover:text-red-400 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4">
                                <div ref={scrollRef} className="space-y-4">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                                                }`}>
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* Quick Actions */}
                            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-white/5">
                                <button className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[10px] flex items-center gap-1 border border-white/10 transition-colors">
                                    <Navigation size={10} /> Navigate
                                </button>
                                <button className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[10px] flex items-center gap-1 border border-white/10 transition-colors">
                                    <ShieldCheck size={10} /> Admin Only
                                </button>
                                <button className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[10px] flex items-center gap-1 border border-white/10 transition-colors">
                                    <HelpCircle size={10} /> FAQ
                                </button>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Message CUBIQO..."
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                                    <Send size={18} />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
}
