'use client'

/**
 * Founders Dashboard v2
 * Control panel for managing features with dual-toggle (Founder vs Public) support
 * Includes expanded integration list and granular permissions
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { Action } from '@/lib/actions/action-types'
import { AppLayout } from '@/components/AppLayout'
import { isFounder as checkIsFounder } from '@/lib/auth/feature-gate-simple'

type FeatureFlag = {
    id: string
    feature_id: string
    name: string
    description: string
    enabled_for_production: boolean
    enabled_for_founders: boolean
    risk_level: 'safe' | 'moderate' | 'dangerous'
    category: 'tools' | 'experience' | 'integrations' | 'agents' | 'extension'
}

type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
}

export default function FoundersDashboard() {
    const router = useRouter()
    const [features, setFeatures] = useState<FeatureFlag[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState<{ id: string, target: 'production' | 'founders' } | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [isAuthed, setIsAuthed] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const supabase = createClient()

    // Check auth and load features
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
                const isFounderUser = checkIsFounder(user?.email)

                if (isFounderUser) {
                    setIsAuthed(true)
                    loadFeaturesWithTimeout()
                    return
                }

                // If not founder user but session is valid, what then?
                // Currently, if session PIN is valid, we already returned.
                // If Supabase user is not founder, we should NOT grant access.
                // So falling through to redirect is correct behavior here.
            } catch (e) {
                console.error("Auth check error", e)
            }

            // 3. Failed
            console.log('[Dashboard] Auth failed, redirecting...')
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
                    // Merge with defaults to ensure new features appear
                    const defaults = getDefaultFeatures()
                    const merged = defaults.map(def => {
                        const existing = data.find(d => d.feature_id === def.feature_id)
                        return existing ? { ...def, ...existing } : def
                    })
                    setFeatures(merged)
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

    // Default features fallback - EXPANDED LIST
    function getDefaultFeatures(): FeatureFlag[] {
        return [
            // Core Tools
            { id: '1', feature_id: 'web_search', name: 'Web Search', description: 'Search the web', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '2', feature_id: 'vision_analyze', name: 'Vision Analysis', description: 'Analyze images', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '3', feature_id: 'file_read', name: 'File Read', description: 'Read files', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'tools' },
            { id: '4', feature_id: 'exec', name: 'Shell Execution', description: 'Execute commands', enabled_for_production: false, enabled_for_founders: true, risk_level: 'dangerous', category: 'tools' },
            { id: '8', feature_id: 'code_panel', name: 'Code Panel', description: 'Visual code editor', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'tools' },
            { id: '24', feature_id: 'browser_control', name: 'Browser Control', description: 'Full browser automation', enabled_for_production: false, enabled_for_founders: true, risk_level: 'dangerous', category: 'tools' },

            // Experience
            { id: '6', feature_id: 'voice_mode', name: 'Voice Mode', description: 'Voice input/output', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },
            { id: '7', feature_id: 'duo_mode', name: 'Duo Mode', description: 'Proactive AI interjections', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },
            { id: '9', feature_id: 'action_cards', name: 'Action Cards', description: 'Confirmation cards for actions', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },
            { id: '16', feature_id: 'sidekick_mode', name: 'Sidekick Companion', description: 'AI companion mode', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },
            { id: '17', feature_id: 'cope_mode', name: 'Cope Up Mode', description: 'Therapeutic support mode', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'experience' },

            // Chrome Extension
            { id: 'ext_download', feature_id: 'extension_download', name: 'Chrome Extension', description: 'Install the CubiQo Sidekick', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'extension' },

            // Integrations: Email
            { id: '5a', feature_id: 'email_read', name: 'Email (Read)', description: 'Read & Draft Emails', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },
            { id: '5b', feature_id: 'email_send', name: 'Email (Send)', description: 'Send Emails', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: WhatsApp
            { id: '10a', feature_id: 'whatsapp_read', name: 'WhatsApp (Read)', description: 'Read & Draft', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '10b', feature_id: 'whatsapp_send', name: 'WhatsApp (Send)', description: 'Send Messages', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: Telegram
            { id: '11a', feature_id: 'telegram_read', name: 'Telegram (Read)', description: 'Read & Draft', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '11b', feature_id: 'telegram_send', name: 'Telegram (Send)', description: 'Send Messages', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: Discord
            { id: '12a', feature_id: 'discord_read', name: 'Discord (Read)', description: 'Read & Draft', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '12b', feature_id: 'discord_send', name: 'Discord (Send)', description: 'Send Messages', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: Slack
            { id: '13a', feature_id: 'slack_read', name: 'Slack (Read)', description: 'Read & Draft', enabled_for_production: false, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '13b', feature_id: 'slack_send', name: 'Slack (Send)', description: 'Send Messages', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: Maps
            { id: '14a', feature_id: 'maps_read', name: 'Maps (Read)', description: 'Search & View', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '14b', feature_id: 'maps_write', name: 'Maps (Nav)', description: 'Start Navigation', enabled_for_production: false, enabled_for_founders: true, risk_level: 'moderate', category: 'integrations' },

            // Integrations: Uber
            { id: '15a', feature_id: 'uber_read', name: 'Uber (Read)', description: 'Estimates & View', enabled_for_production: true, enabled_for_founders: true, risk_level: 'safe', category: 'integrations' },
            { id: '15b', feature_id: 'uber_write', name: 'Uber (Request)', description: 'Request Rides', enabled_for_production: false, enabled_for_founders: true, risk_level: 'dangerous', category: 'integrations' },
        ]
    }

    // Toggle feature for production or founders
    // Toggle feature for production or founders
    // Toggle feature for production or founders
    const toggleFeature = async (featureId: string, target: 'production' | 'founders') => {
        const feature = features.find(f => f.feature_id === featureId)
        if (!feature) return

        setSaving({ id: featureId, target })
        setErrorMessage(null)

        const field = target === 'production' ? 'enabled_for_production' : 'enabled_for_founders'
        const newValue = !feature[field]

        // Update local state immediately for responsiveness
        setFeatures(prev => prev.map(f =>
            f.feature_id === featureId
                ? { ...f, [field]: newValue }
                : f
        ))

        // SYNC WITH LOCAL STORAGE FOR USER PREVIEW (Run My CubiQo)
        if (target === 'production') {
            try {
                // Map feature_id to feature-gate keys
                // Mapping table based on feature-gate-simple.ts
                const keyMap: Record<string, string> = {
                    'web_search': 'browser',
                    'vision_analyze': 'browser',
                    'file_read': 'files',
                    'exec': 'codeExecution',
                    'code_panel': 'codeExecution',
                    'browser_control': 'browser',
                    'voice_mode': 'voice_mode',
                    'duo_mode': 'duo_mode',
                    'action_cards': 'action_cards',
                    'sidekick_mode': 'sidekick_mode',
                    'cope_mode': 'cope_mode',
                    'email_read': 'gmail',
                    'email_send': 'gmailWrite',
                    'whatsapp_read': 'integrations',
                    'whatsapp_send': 'integrations',
                    'telegram_read': 'integrations',
                    'telegram_send': 'integrations',
                    'discord_read': 'discord',
                    'discord_send': 'discord',
                    'slack_read': 'slack',
                    'slack_send': 'slack',
                    'maps_read': 'integrations',
                    'maps_write': 'integrations',
                    'uber_read': 'integrations',
                    'uber_write': 'integrations',
                    'extension_download': 'admin'
                }

                const simpleKey = keyMap[featureId]
                if (simpleKey) {
                    const stored = localStorage.getItem('userAccess')
                    const currentAccess = stored ? JSON.parse(stored) : {}
                    const updatedAccess = { ...currentAccess, [simpleKey]: newValue }
                    localStorage.setItem('userAccess', JSON.stringify(updatedAccess))
                }

                // Sync the FULL production map for the Settings panel filtering
                const productionMap: Record<string, boolean> = {}
                features.forEach(f => {
                    productionMap[f.feature_id] = f.feature_id === featureId ? newValue : f.enabled_for_production
                })
                localStorage.setItem('cubiqo_dashboard_production', JSON.stringify(productionMap))

                // Dispatch storage event so other tabs/components update
                window.dispatchEvent(new Event('storage'))
            } catch (e) {
                console.error("Failed to sync local storage", e)
            }
        }

        // 3. Persist to DB via Admin API (Bypassing RLS)
        try {
            const response = await fetch('/api/admin/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-founder-auth': sessionStorage.getItem('founders_pass_auth') || 'false'
                },
                body: JSON.stringify({
                    featureId: feature.feature_id,
                    target,
                    enabled: newValue
                })
            })

            const result = await response.json()

            if (!response.ok || result.error) {
                throw new Error(result.error || 'Failed to update')
            }

            // Success feedback
            if (target === 'production') {
                setErrorMessage(null)
                setSuccessMessage(`${feature.name} Pushed Live!`)
                setTimeout(() => setSuccessMessage(null), 3000)
                console.log(`[Dashboard] ${feature.name} pushed to production.`)
            }

        } catch (e: any) {
            console.error('[Dashboard] Exception saving feature:', e)
            setErrorMessage(`Exception saving ${feature.name}: ${e.message || e}`)
            // Revert on exception
            setFeatures(prev => prev.map(f =>
                f.feature_id === featureId
                    ? { ...f, [field]: !newValue }
                    : f
            ))
        }

        setSaving(null)
    }

    const handleActionConfirm = async (actionId: string, action: Action) => {
        console.log('[Dashboard] Confirming action:', action)

        try {
            if (action.type === 'system_command') {
                // Implementation for system command
                const cmd = (action as any).command
                await fetch('/api/code/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: cmd, language: 'bash' })
                })
            } else if (action.type === 'generic' && (action as any).actionLabel === 'Deploy to Vercel') {
                // Quick Vercel deploy hook
                const projectId = (action as any).details?.projectId
                await fetch('/api/admin/connections/vercel/deploy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId })
                })
            } else if (action.type === 'generic' && (action as any).actionLabel === 'Update Experiment') {
                // Experiment update hook
                const { experimentId, metadata } = (action as any).details
                await fetch('/api/admin/experiments/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ experimentId, command: 'force_update', metadata })
                })
            }
            setSuccessMessage(`Action ${action.title} executed successfully.`)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (e) {
            setErrorMessage(`Failed to execute action: ${e}`)
        }
    }

    const sendChat = async () => {
        if (!chatInput.trim() || chatLoading) return

        const userMessage = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setChatLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `[FOUNDER CONTEXT] I'm the founder of CubiQo deciding which features to enable. 
                    Current feature states: ${JSON.stringify(features.map(f => ({ name: f.name, public: f.enabled_for_production, founder: f.enabled_for_founders, risk: f.risk_level })))}. 
                    User question: ${userMessage}`,
                    currentColor: 'ORANGE',
                    isFounder: true // Escalate to high-efficiency agent
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
        experience: '✨ Experience',
        extension: '🧩 Extension'
    }

    // Extension features are now in default features
    /*
    const extensionFeatures: FeatureFlag[] = [{
        id: 'ext_download',
        feature_id: 'extension_download',
        name: 'Chrome Extension',
        description: 'Install the CubiQo Sidekick',
        enabled_for_production: true,
        enabled_for_founders: true,
        risk_level: 'safe',
        category: 'extension'
    }]
    if (!groupedFeatures['extension']) {
        groupedFeatures['extension'] = extensionFeatures
    }
    */

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
        <AppLayout>
            <div className="min-h-screen bg-black font-sans">
                {/* Header - Simplified for Sidebar Compatibility */}
                <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
                    <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                                <span className="text-xl font-bold text-black">F</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Founders Pass</h1>
                                <p className="text-sm text-gray-400 hidden sm:block">Control what users see on cubiqo.ai</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-amber-400 font-medium hidden sm:inline">Founder Mode Active</span>

                            <button
                                onClick={() => {
                                    localStorage.setItem('cubiqo_simulate_user', 'true')
                                    window.open('/', '_blank')
                                }}
                                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                            >
                                Quick View ↗
                            </button>

                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('founders_pass_auth')
                                    router.push('/founderspass')
                                }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Lock Dashboard
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-[1400px] mx-auto px-6 py-8">
                    {/* Layout: Features Left, Chat Right */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Left: Feature Toggles (Span 2 cols) */}
                        <div className="xl:col-span-2">
                            {errorMessage && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 flex items-center gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="text-sm font-medium">{errorMessage}</span>
                                    <button onClick={() => setErrorMessage(null)} className="ml-auto hover:text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/50 text-green-200 flex items-center gap-3 animate-pulse">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-sm font-medium">{successMessage}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">Feature Controls</h2>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-gray-400">Enabled</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                        <span className="text-gray-400">Disabled</span>
                                    </div>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="text-gray-400 text-center py-12">Loading features...</div>
                            ) : (
                                <div className="space-y-8">
                                    {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                                        <div key={category} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                                            <div className="px-6 py-4 bg-gray-800/30 border-b border-gray-800 flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-gray-200">
                                                    {categoryLabels[category] || category}
                                                </h3>
                                                <div className="flex gap-12 text-[10px] uppercase tracking-wider font-semibold text-gray-500 pr-8">
                                                    <span className="w-24 text-center">My Systems</span>
                                                    <span className="w-24 text-center">Generic Users</span>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-gray-800">
                                                {categoryFeatures.map(feature => (
                                                    <div
                                                        key={feature.feature_id}
                                                        className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        {/* Feature Info */}
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold ${riskColors[feature.risk_level]}`}>
                                                                {feature.risk_level}
                                                            </span>
                                                            <div>
                                                                <div className="text-white font-medium text-sm">{feature.name}</div>
                                                                <div className="text-xs text-gray-500">{feature.description}</div>
                                                            </div>
                                                        </div>

                                                        {/* Toggles Container */}
                                                        <div className="flex items-center gap-12">

                                                            {/* Founder Toggle */}
                                                            <div className="flex flex-col items-center gap-2 w-24">
                                                                <button
                                                                    onClick={() => toggleFeature(feature.feature_id, 'founders')}
                                                                    disabled={saving?.id === feature.feature_id}
                                                                    className={`
                                                                    relative w-14 h-7 rounded-full transition-all duration-300 shadow-inner
                                                                    ${feature.enabled_for_founders ? 'bg-amber-500 shadow-amber-500/50' : 'bg-gray-800 border border-gray-700'}
                                                                    ${saving?.id === feature.feature_id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105'}
                                                                `}
                                                                >
                                                                    <div className={`
                                                                    absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
                                                                    ${feature.enabled_for_founders ? 'left-8' : 'left-1'}
                                                                `} />
                                                                </button>
                                                            </div>

                                                            {/* Public Toggle */}
                                                            <div className="flex flex-col items-center gap-2 w-24">
                                                                <button
                                                                    onClick={() => toggleFeature(feature.feature_id, 'production')}
                                                                    disabled={saving?.id === feature.feature_id}
                                                                    className={`
                                                                    relative w-14 h-7 rounded-full transition-all duration-300 shadow-inner
                                                                    ${feature.enabled_for_production ? 'bg-green-500 shadow-green-500/50' : 'bg-gray-800 border border-gray-700'}
                                                                    ${saving?.id === feature.feature_id ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105'}
                                                                `}
                                                                >
                                                                    <div className={`
                                                                    absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
                                                                    ${feature.enabled_for_production ? 'left-8' : 'left-1'}
                                                                `} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: AI Assistant (Sticky) */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                    <div className="p-5 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                            💬 Ask CubiQo
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Get recommendations on safe configuration
                                        </p>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-12 px-4">
                                                <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="text-2xl">🤖</span>
                                                </div>
                                                <p className="mb-6 text-sm">I can help you decide what's safe to enable for the public vs yourself.</p>
                                                <div className="space-y-2 text-xs text-left">
                                                    <button
                                                        onClick={() => setChatInput("Should I enable Uber requests for generic users?")}
                                                        className="block w-full px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 hover:border-gray-600"
                                                    >
                                                        "Should I enable Uber for public?"
                                                    </button>
                                                    <button
                                                        onClick={() => setChatInput("What are the risks of Browser Control?")}
                                                        className="block w-full px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 hover:border-gray-600"
                                                    >
                                                        "Risks of Browser Control?"
                                                    </button>
                                                    <button
                                                        onClick={() => setChatInput("Configure a safe 'Read-Only' public mode")}
                                                        className="block w-full px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-700/50 hover:border-gray-600"
                                                    >
                                                        "Set safe public defaults"
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg, i) => (
                                                <ChatMessage
                                                    key={i}
                                                    role={msg.role}
                                                    content={msg.content}
                                                    color="ORANGE"
                                                />
                                            ))
                                        )}
                                        {chatLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-800/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                                placeholder="Ask about safety..."
                                                className="flex-1 px-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                                            />
                                            <button
                                                onClick={sendChat}
                                                disabled={chatLoading || !chatInput.trim()}
                                                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
