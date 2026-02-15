'use client'

import { useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGE_MAP: Record<string, string> = {
  tsx: 'typescript',
  ts: 'typescript',
  json: 'json',
  css: 'css',
  html: 'html',
  js: 'javascript',
  jsx: 'javascript',
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || 'tsx'
  return LANGUAGE_MAP[ext] || 'typescript'
}

/** Build the sandboxed preview HTML with strict CSP */
function buildPreviewHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; background: #18181b; color: #e4e4e7; }
  .error { color: #f87171; white-space: pre-wrap; }
</style>
</head>
<body>
<div id="root"></div>
<script>
try {
  const root = document.getElementById('root');
  const result = (function() { ${code} })();
  if (result !== undefined) {
    root.textContent = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
  }
} catch(e) {
  document.getElementById('root').innerHTML = '<pre class="error">' + e.message + '</pre>';
}
</script>
</body>
</html>`
}

interface LiveCoderPaneProps {
  initialCode?: string
}

export default function LiveCoderPane({ initialCode }: LiveCoderPaneProps) {
  const [filePath, setFilePath] = useState('component.tsx')
  const [code, setCode] = useState(initialCode || '// Start coding here\n')
  const [previewHtml, setPreviewHtml] = useState('')
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleRunCode = useCallback(() => {
    setPreviewHtml(buildPreviewHtml(code))
    setDiagnostics([])
  }, [code])

  // Monaco MarkerSeverity: Hint=1, Info=2, Warning=4, Error=8
  const MONACO_SEVERITY_ERROR = 8

  const handleEditorValidation = useCallback((markers: Array<{ message: string; startLineNumber: number; severity: number }>) => {
    setDiagnostics(
      markers
        .filter((m) => m.severity >= MONACO_SEVERITY_ERROR)
        .map((m) => `Line ${m.startLineNumber}: ${m.message}`)
    )
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-zinc-700 flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Live Coder
        </span>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="path/to/file.tsx"
          className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={handleRunCode}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors"
        >
          Run Code
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getLanguage(filePath)}
          value={code}
          theme="vs-dark"
          onChange={(v) => setCode(v || '')}
          onValidate={handleEditorValidation}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            folding: true,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <div className="px-3 py-1 border-t border-zinc-700 bg-red-950/30 shrink-0 max-h-[80px] overflow-auto">
          {diagnostics.map((d, i) => (
            <p key={i} className="text-xs text-red-400">{d}</p>
          ))}
        </div>
      )}

      {/* Preview */}
      <div className="border-t border-zinc-700 shrink-0" style={{ height: '35%', minHeight: 80 }}>
        <div className="px-3 py-1 flex items-center justify-between bg-zinc-900">
          <span className="text-xs text-zinc-500">Preview (sandboxed)</span>
        </div>
        {previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            sandbox="allow-scripts"
            title="Live Preview"
            className="w-full bg-zinc-900"
            style={{ height: 'calc(100% - 28px)', border: 'none' }}
          />
        ) : (
          <div className="flex items-center justify-center h-[calc(100%-28px)] text-xs text-zinc-600">
            Click &quot;Run Code&quot; to see preview
          </div>
        )}
      </div>
    </div>
  )
}
