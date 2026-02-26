'use client';

import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Zap, Activity } from 'lucide-react';

interface ConversationPanelProps {
  onCodeGenerated?: (code: string, language: string) => void;
}

export default function ConversationPanel({ onCodeGenerated }: ConversationPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: 'studio-session',
          context: 'studio-builder',
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();
      const aiContent = data.response || 'I apologize, I couldn\'t process that request. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);

      if (onCodeGenerated) {
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(aiContent)) !== null) {
          onCodeGenerated(match[2].trim(), match[1] || 'typescript');
          break;
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'SYSTEM_ERROR: Connection to LLM kernel interrupted.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* HUD Header */}
      <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_cyan]" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
              Brain Core <span className="text-white/20">//</span> Uplink
            </h2>
          </div>
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">v4.0.2</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span className="text-[9px] text-green-500 font-bold uppercase italic">Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] text-cyan-500 font-bold uppercase italic">Syncing</span>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="p-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 group">
              <Zap className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 underline underline-offset-8 decoration-cyan-500/50">Describe Intent</h3>
            <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px] uppercase">Initialize neural construction by inputting a high-level architectural descriptor below.</p>
          </div>
        ) : (
          <>
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[90%] relative group ${message.role === 'user'
                  ? 'text-right'
                  : 'text-left'
                  }`}>
                  <div className={`text-[8px] font-black uppercase tracking-widest mb-1.5 ${message.role === 'user' ? 'text-white/40' : 'text-cyan-400/80'}`}>
                    {message.role === 'user' ? 'Local_User_ID_07' : 'Emergent_AI_Agent'}
                  </div>
                  <div className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${message.role === 'user'
                    ? 'bg-white/5 border-white/10 text-white rounded-tr-none shadow-xl'
                    : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-50 border-tl-none shadow-[0_0_30px_rgba(0,255,255,0.05)]'
                    }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans tracking-wide">
                      {message.content.split(/(```\w*\n[\s\S]*?```)/g).map((part, j) => {
                        const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
                        if (codeMatch) {
                          return (
                            <div key={j} className="my-4 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                              <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
                                <span className="text-[10px] uppercase font-black tracking-widest text-white/40">{codeMatch[1] || 'code_block'}</span>
                                {onCodeGenerated && (
                                  <button
                                    onClick={() => onCodeGenerated(codeMatch[2].trim(), codeMatch[1] || 'typescript')}
                                    className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors flex items-center gap-1"
                                  >
                                    <Activity className="w-3 h-3" /> Mount System
                                  </button>
                                )}
                              </div>
                              <pre className="bg-black/40 p-4 text-xs overflow-x-auto selection:bg-cyan-500/30">
                                <code className="text-cyan-200/90">{codeMatch[2].trim()}</code>
                              </pre>
                            </div>
                          );
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl">
                  Deciphering Intent...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Terminal */}
      <div className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex gap-1 bg-black/60 rounded-2xl border border-white/10 overflow-hidden p-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder={isLoading ? "SYSTEM_BUSY..." : "CMD > ENTER INSTRUCTION..."}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none px-5 py-4 text-xs font-bold tracking-widest focus:outline-none disabled:opacity-50 placeholder-white/20 text-white selection:bg-cyan-500/30"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`px-6 bg-white text-black rounded-xl font-black uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center justify-center ${isLoading ? 'animate-pulse' : ''}`}
            >
              Uplink
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
