'use client'

/**
 * Founders Dashboard
 * Control panel for managing what features are available to generic users
 * Includes conversational interface for getting AI recommendations
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type FeatureFlag = {
    id: string
    feature_id: string
    name: string
    description: string
    enabled_for_production: boolean
    enabled_for_founders: boolean
    risk_level: 'safe' | 'moderate' | 'dangerous'
    category: string
}

type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
}

export default function FoundersDashboard() {
    const router = useRouter()
    const [features, setFeatures] = useState<FeatureFlag[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [isAuthed, setIsAuthed] = useState(false)

    const supabase = createClient()

    // Check session storage auth and load features
    useEffect(() => {
        const checkAuth = async () => {
            const founderAuth = sessionStorage.getItem('founders_pass_auth')

            // 1. Immediate Bypass if PIN was used
            if (founderAuth === 'true') {
                setIsAuthed(true)
                loadFeaturesWithTimeout()
                return
            }

            // 2. Fallback to Supabase Auth
            try {
                const { data: { user } } = await supabase.auth.getUser()
                const isFounderUser = user?.email === 'aditya@cubiqo.ai'

                if (isFounderUser) {
                    setIsAuthed(true)
                    loadFeaturesWithTimeout()
                    return
                }
            } catch (e) {
                console.error("Auth check error", e)
            }

            // 3. Failed
            console.log('[Dashboard] Auth failed, redirecting to /founderspass')
            router.push('/founderspass')
        }

        const loadFeaturesWithTimeout = async () => {
            console.log('[Dashboard] Loading features...')

            // Race between fetch and 3s timeout
            const fetchPromise = (async () => {
                try {
                    // Cast to any because feature_flags table may not be in generated types yet
                    const { data, error } = await (supabase as any)
                        .from('feature_flags')
                        .select('*')
                        .order('category', { ascending: true })
                        .order('name', { ascending: true })

                    if (error) throw error
                    return data
                } catch (e) {
                    throw e
                }
            })()

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            )

            try {
                const data = await Promise.race([fetchPromise, timeoutPromise]) as FeatureFlag[]
                if (data && data.length > 0) {
                    setFeatures(data)
                } else {
                    setFeatures(getDefaultFeatures())
                }
            } catch (e) {
                console.warn('[Dashboard] Feature load failed or timed out, using defaults', e)
                setFeatures(getDefaultFeatures())
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router, supabase])

    // Default features fallback
    function getDefaultFeatures(): FeatureFlag[] {
        return [
            { id: '1', feature_id: 'web_search', name: 'Web Search', description: 'Search the web', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '2', feature_id: 'vision_analyze', name: 'Vision Analysis', description: 'Analyze images', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '3', feature_id: 'file_read', name: 'File Read', description: 'Read files', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '4', feature_id: 'exec', name: 'Shell Execution', description: 'Execute commands', enabled_for_production: false, enabled_for_founders: true, risk_level: 'dangerous', category: 'tools' },
            { id: '5', feature_id: 'email_send', name: 'Email Send', description: 'Send emails', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },
            { id: '6', feature_id: 'voice_mode', name: 'Voice Mode', description: 'Voice input/output', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },
        ]
    }

    // Toggle feature for production
    const toggleFeature = async (featureId: string) => {
        const feature = features.find(f => f.feature_id === featureId)
        if (!feature) return

        setSaving(featureId)
        const newValue = !feature.enabled_for_production

        const { error } = await (supabase as any)
            .from('feature_flags')
            .update({
                enabled_for_production: newValue,
                updated_at: new Date().toISOString()
            })
            .eq('feature_id', featureId)

        if (!error) {
            setFeatures(prev => prev.map(f =>
                f.feature_id === featureId
                    ? { ...f, enabled_for_production: newValue }
                    : f
            ))
        }
        setSaving(null)
    }

    // Send chat message to get AI recommendations
    const sendChat = async () => {
        if (!chatInput.trim() || chatLoading) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setChatLoading(true)

        try {
            // Call the chat API with founder context
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `[FOUNDER CONTEXT] I'm the founder of CubiQo deciding which features to enable for generic users. Current feature states: ${JSON.stringify(features.map(f => ({ name: f.name, enabled: f.enabled_for_production, risk: f.risk_level })))}. User question: ${userMessage}`,
                    currentColor: 'ORANGE'
                })
            })

            const data = await response.json()
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || "I couldn't process that. Please try again."
            }])
        } catch (error) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: "Error connecting to AI. Please try again."
            }])
        } finally {
            setChatLoading(false)
        }
    }

    // Group features by category
    const groupedFeatures = features.reduce((acc, feature) => {
        if (!acc[feature.category]) acc[feature.category] = []
        acc[feature.category].push(feature)
        return acc
    }, {} as Record<string, FeatureFlag[]>)

    const categoryLabels: Record<string, string> = {
        tools: '🛠️ Tools',
        integrations: '🔗 Integrations',
        agents: '🤖 Agents',
        experience: '✨ Experience'
    }

    const riskColors = {
        safe: 'text-green-400 bg-green-500/10',
        moderate: 'text-yellow-400 bg-yellow-500/10',
        dangerous: 'text-red-400 bg-red-500/10'
    }

    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-black">F</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Founders Pass</h1>
                            <p className="text-sm text-gray-400">Control what users see on cubiqo.ai</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-amber-400 font-medium">Founder Access</span>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('founders_pass_auth')
                                router.push('/founderspass')
                            }}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Feature Toggles */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Production Features</h2>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">ON = Generic users can use</span>
                                <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400">OFF = Founders only</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-gray-400 text-center py-12">Loading features...</div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                                    <div key={category} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-4">
                                            {categoryLabels[category] || category}
                                        </h3>
                                        <div className="space-y-3">
                                            {categoryFeatures.map(feature => (
                                                <div
                                                    key={feature.feature_id}
                                                    className="flex items-center justify-between py-2"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${riskColors[feature.risk_level]}`}>
                                                            {feature.risk_level}
                                                        </span>
                                                        <div>
                                                            <div className="text-white font-medium">{feature.name}</div>
                                                            <div className="text-xs text-gray-500">{feature.description}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleFeature(feature.feature_id)}
                                                        disabled={saving === feature.feature_id}
                                                        className={`
                              relative w-12 h-6 rounded-full transition-all
                              ${feature.enabled_for_production
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-600'
                                                            }
                              ${saving === feature.feature_id ? 'opacity-50' : ''}
                            `}
                                                    >
                                                        <div className={`
                              absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all
                              ${feature.enabled_for_production ? 'left-6' : 'left-0.5'}
                            `} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: AI Assistant */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    💬 Ask CubiQo
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Get recommendations on which features to enable for users
                                </p>
                            </div>

                            {/* Chat Messages */}
                            <div className="h-80 overflow-y-auto p-4 space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <p className="mb-4">Ask me about feature decisions:</p>
                                        <div className="space-y-2 text-sm">
                                            <button
                                                onClick={() => setChatInput("Should I enable email for generic users?")}
                                                className="block w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                                            >
                                                "Should I enable email for generic users?"
                                            </button>
                                            <button
                                                onClick={() => setChatInput("What's the risk of enabling browser automation?")}
                                                className="block w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                                            >
                                                "What's the risk of browser automation?"
                                            </button>
                                            <button
                                                onClick={() => setChatInput("Give me a safe default configuration")}
                                                className="block w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                                            >
                                                "Give me a safe default configuration"
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] px-4 py-2 rounded-xl ${msg.role === 'user'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 text-gray-200'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-xl">
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-800">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                        placeholder="Ask about feature decisions..."
                                        className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                    <button
                                        onClick={sendChat}
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {features.filter(f => f.enabled_for_production).length}
                                </div>
                                <div className="text-xs text-gray-500">Enabled</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-gray-400">
                                    {features.filter(f => !f.enabled_for_production).length}
                                </div>
                                <div className="text-xs text-gray-500">Disabled</div>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-red-400">
                                    {features.filter(f => f.risk_level === 'dangerous').length}
                                </div>
                                <div className="text-xs text-gray-500">Dangerous</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
