'use client';

import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'typescript',
  theme = 'vs-dark' 
}: CodeEditorProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(value) => onChange(value || '')}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-gray-400">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
