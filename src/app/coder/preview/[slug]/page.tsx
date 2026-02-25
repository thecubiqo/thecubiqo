'use client';

/**
 * CubiQo Coder — Project Preview Page
 *
 * Renders a live preview for a specific project identified by its slug.
 * Accessed via wildcard subdomain routing: <slug>.cubiqo.dev → /coder/preview/<slug>
 *
 * The slug is mapped to a project_id via the emergent_workspaces table.
 * If the project has a running workspace with a preview URL, we render it
 * in an iframe. Otherwise we show a status page.
 */

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ProjectPreview {
  id: string;
  name: string;
  status: string;
  previewUrl: string | null;
  runtime: string;
}

export default function ProjectPreviewPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/emergent/preview/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'Project not found' : `Error: ${res.status}`);
          return;
        }
        const data = await res.json();
        setPreview(data.project);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading project preview...</p>
          <p className="text-xs text-gray-600 font-mono">{slug}.cubiqo.dev</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-white">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-bold">Project Not Found</h1>
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-xs text-gray-600 font-mono">{slug}.cubiqo.dev</p>
          <a
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm transition-colors"
          >
            Go to CubiQo Studio
          </a>
        </div>
      </div>
    );
  }

  if (preview?.previewUrl) {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0f]">
        {/* Thin status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#111118] border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-400">{preview.name}</span>
            <span className="text-gray-600 font-mono">{slug}.cubiqo.dev</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">{preview.runtime}</span>
            <a
              href={preview.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Open in new tab ↗
            </a>
          </div>
        </div>
        <iframe
          src={preview.previewUrl}
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={`${preview.name} Preview`}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-white">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">🚧</div>
        <h1 className="text-xl font-bold">{preview?.name || slug}</h1>
        <div className="flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            preview?.status === 'running' ? 'bg-green-400' :
            preview?.status === 'creating' ? 'bg-yellow-400 animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="text-sm text-gray-400 capitalize">{preview?.status || 'unknown'}</span>
        </div>
        <p className="text-xs text-gray-600">
          This project workspace is {preview?.status === 'running' ? 'running but has no preview URL yet.' : 'not currently active.'}
        </p>
        <p className="text-xs text-gray-600 font-mono">{slug}.cubiqo.dev</p>
      </div>
    </div>
  );
}
