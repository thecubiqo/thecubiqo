'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Film, File, CheckCircle2, X, Copy, Loader2 } from 'lucide-react';

interface UploadedAsset {
    name: string;
    path: string;    // workspace path e.g. public/hero.jpg
    url: string;     // usage reference e.g. /hero.jpg
    type: 'image' | 'video' | 'other';
    size: number;
}

interface AssetUploadProps {
    workspaceId: string;
    onAssetUploaded?: (asset: UploadedAsset) => void;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getAssetType(file: File): 'image' | 'video' | 'other' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'other';
}

export default function AssetUpload({ workspaceId, onAssetUploaded }: AssetUploadProps) {
    const [assets, setAssets] = useState<UploadedAsset[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFile = useCallback(async (file: File) => {
        setUploading(file.name);

        try {
            const reader = new FileReader();
            const content = await new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Strip data URL prefix for binary files - store as base64
                    resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Save to workspace under public/ so it's referenceable in code
            const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
            const workspacePath = `public/${filename}`;
            const publicUrl = `/${filename}`;

            const res = await fetch('/api/emergent/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspaceId,
                    path: workspacePath,
                    content, // base64 data URL - agent can reference it
                }),
            });

            const asset: UploadedAsset = {
                name: filename,
                path: workspacePath,
                url: publicUrl,
                type: getAssetType(file),
                size: file.size,
            };

            setAssets(prev => [asset, ...prev.filter(a => a.name !== filename)]);
            onAssetUploaded?.(asset);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(null);
        }
    }, [workspaceId, onAssetUploaded]);

    const handleFiles = useCallback((files: FileList | File[]) => {
        Array.from(files).forEach(file => uploadFile(file));
    }, [uploadFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1500);
    };

    const removeAsset = (name: string) => {
        setAssets(prev => prev.filter(a => a.name !== name));
    };

    return (
        <div className="flex flex-col h-full bg-black/20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] shrink-0">
                <div className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <h2 className="text-xs font-black uppercase tracking-[0.25em] text-purple-400">Assets</h2>
                </div>
                <p className="text-[10px] text-white/20 mt-0.5 uppercase tracking-widest font-bold">
                    Drop hero, logo, product images
                </p>
            </div>

            {/* Drop Zone */}
            <div className="p-3 shrink-0">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => inputRef.current?.click()}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-6 flex flex-col items-center gap-2 text-center
            ${isDragging
                            ? 'border-purple-400/60 bg-purple-500/10 scale-[1.02]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/60">
                                Uploading {uploading}…
                            </span>
                        </>
                    ) : (
                        <>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDragging ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                <Upload className={`w-5 h-5 transition-colors ${isDragging ? 'text-purple-400' : 'text-white/20'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-white/30">
                                    Drop files here
                                </p>
                                <p className="text-[10px] text-white/15 mt-0.5">
                                    Hero images · Logos · Videos · PNGs
                                </p>
                            </div>
                        </>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.svg,.gif"
                        className="hidden"
                        onChange={e => e.target.files && handleFiles(e.target.files)}
                    />
                </div>
            </div>

            {/* Hint about quality */}
            <div className="px-4 py-2 mx-3 mb-3 rounded-xl bg-purple-500/5 border border-purple-500/10 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400/50 mb-1">Print Quality Tip</p>
                <p className="text-[9px] text-white/20 leading-relaxed">
                    Logo for embroidery: <strong className="text-white/30">vector SVG or PNG 300dpi+</strong><br />
                    Hero image: <strong className="text-white/30">min 2560 × 1440px</strong>, near-black preferred
                </p>
            </div>

            {/* Uploaded Assets */}
            <div className="flex-1 overflow-y-auto px-3 space-y-2 min-h-0 custom-scrollbar">
                {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-30">
                        <ImageIcon className="w-6 h-6 text-white/20" />
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">No assets yet</p>
                    </div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.name} className="group relative rounded-xl border border-white/8 bg-white/[0.03] hover:border-purple-500/20 hover:bg-white/[0.05] transition-all p-2.5">
                            <div className="flex items-start gap-2.5">
                                {/* Thumbnail/icon */}
                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    {asset.type === 'image' ? (
                                        <ImageIcon className="w-4 h-4 text-purple-400/60" />
                                    ) : asset.type === 'video' ? (
                                        <Film className="w-4 h-4 text-cyan-400/60" />
                                    ) : (
                                        <File className="w-4 h-4 text-white/20" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                                        <span className="text-[10px] font-bold text-white/50 truncate">{asset.name}</span>
                                    </div>
                                    <p className="text-[9px] text-white/20">{formatSize(asset.size)}</p>

                                    {/* Copy URL button */}
                                    <button
                                        onClick={() => copyToClipboard(asset.url)}
                                        className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-purple-400/50 hover:text-purple-400 transition-colors group/copy"
                                    >
                                        <Copy className="w-2.5 h-2.5" />
                                        <span className="truncate">{copied === asset.url ? 'Copied!' : asset.url}</span>
                                    </button>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => removeAsset(asset.name)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Usage hint */}
                            <div className="mt-2 px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
                                <p className="text-[9px] font-mono text-white/20">
                                    {asset.type === 'image'
                                        ? `<img src="${asset.url}" alt="hero" />`
                                        : asset.type === 'video'
                                            ? `<video src="${asset.url}" autoPlay muted loop />`
                                            : `import asset from '${asset.url}'`
                                    }
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
