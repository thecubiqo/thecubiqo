'use client'

import { useState } from 'react'
import { updateExperimentMetadata } from '@/app/admin/experiments/actions'

interface AssetManagerProps {
    experimentId: string
    variant: string
    currentAsset?: string
    metadata: any
}

export function AssetManager({ experimentId, variant, currentAsset, metadata }: AssetManagerProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [fileName, setFileName] = useState(currentAsset || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const newMetadata = {
                ...metadata,
                assets: {
                    ...(metadata?.assets || {}),
                    [variant]: fileName
                }
            }
            await updateExperimentMetadata(experimentId, newMetadata)
            setIsEditing(false)
            // Refresh the page to see changes
            window.location.reload()
        } catch (error) {
            alert('Failed to save asset reference.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isEditing && currentAsset) {
        return (
            <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Active Asset</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                    >
                        CHANGE
                    </button>
                </div>
                <div className="relative group/preview rounded-xl overflow-hidden aspect-video bg-black/40 border border-gray-800">
                    <img
                        src={`/experiments/${currentAsset}`}
                        alt={`Variant ${variant} Asset`}
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">{currentAsset}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (isEditing) {
        return (
            <div className="mt-8 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-black text-purple-400 tracking-widest">Link Asset Filename</span>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-[10px] text-gray-500 hover:text-gray-400 font-bold"
                    >
                        CANCEL
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="design-v1.gif"
                        className="flex-1 bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        {isLoading ? '...' : 'SAVE'}
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-gray-500 leading-tight">
                    Ensure the file is in <code className="text-gray-400">public/experiments/</code>
                </p>
            </div>
        )
    }

    return (
        <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">GIF Asset Layer</span>
                <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 rounded">PENDING</span>
            </div>
            <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 bg-gray-950 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-purple-500 transition-all flex flex-col items-center justify-center gap-2 group/upload"
            >
                <span className="text-xl group-hover/upload:scale-125 transition-transform">🖼️</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">Link GIF filename</span>
            </button>
        </div>
    )
}
