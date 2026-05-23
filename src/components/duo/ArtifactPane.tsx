import { ExternalLink, FileText } from 'lucide-react';

export type DuoArtifactView = {
  id?: string;
  artifact_type?: string | null;
  artifactType?: string | null;
  title?: string | null;
  content?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  created_at?: string | null;
};

type Props = {
  artifact: DuoArtifactView | null;
  isLoading?: boolean;
};

function artifactType(artifact: DuoArtifactView) {
  return artifact.artifactType || artifact.artifact_type || artifact.mime_type || 'text';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function ArtifactPane({ artifact, isLoading = false }: Props) {
  if (isLoading) {
    return <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4 text-sm text-slate-400">Loading artifact...</div>;
  }

  if (!artifact) {
    return <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4 text-sm text-slate-400">No artifact selected.</div>;
  }

  const type = artifactType(artifact).toLowerCase();
  const content = artifact.content || artifact.storage_path || '';
  const title = artifact.title || 'Artifact';

  if (type.includes('code') || type.includes('json') || type.includes('sql') || type.includes('typescript')) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-neutral-950">
        <div className="border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-300">{title}</div>
        <pre className="max-h-96 overflow-auto bg-slate-950 p-3 text-xs leading-5 text-slate-100">
          <code>{content}</code>
        </pre>
      </div>
    );
  }

  if (type.includes('html')) {
    const safeDoc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;margin:16px;color:#e2e8f0;background:#020617;line-height:1.5}a{color:#67e8f9}</style></head><body>${escapeHtml(content).replace(/\n/g, '<br>')}</body></html>`;
    return (
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-neutral-950">
        <div className="border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-300">{title}</div>
        <iframe title={title} srcDoc={safeDoc} sandbox="allow-same-origin" className="h-80 w-full bg-slate-950" />
      </div>
    );
  }

  if (type.includes('url') || /^https?:\/\//i.test(content)) {
    return (
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg border border-slate-800 bg-neutral-950 p-4 text-sm text-cyan-200 hover:bg-slate-900"
      >
        <ExternalLink className="h-4 w-4" />
        <span className="min-w-0 truncate">{title || content}</span>
      </a>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
        <FileText className="h-4 w-4 text-slate-400" />
        {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{content || 'Empty artifact.'}</p>
    </div>
  );
}
