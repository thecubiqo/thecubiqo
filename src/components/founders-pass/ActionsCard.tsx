// Actions Card Component - Requires explicit user confirmation before any side-effect
'use client';

import { useState } from 'react';
import type { ActionTemplate, ActionUISchema } from '@/lib/founders-pass/types';

interface ActionsCardProps {
  template: ActionTemplate;
  generatedContent: Record<string, string>;
  onConfirm: (content: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

export default function ActionsCard({
  template,
  generatedContent,
  onConfirm,
  onCancel,
}: ActionsCardProps) {
  const [content, setContent] = useState<Record<string, string>>(generatedContent);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const schema: ActionUISchema = template.ui_schema ?? {};
  const fields = schema.fields ?? [];

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(content);
      setConfirmed(true);
    } catch (err) {
      
      alert('Action failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-5">
        <p className="text-emerald-300 font-medium">✓ {template.name} completed successfully</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-amber-600/50 rounded-lg overflow-hidden">
      {/* Header with warning */}
      <div className="bg-amber-900/20 border-b border-amber-600/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400">⚠️</span>
          <h3 className="font-semibold text-amber-200">{schema.title ?? template.name}</h3>
        </div>
        <p className="text-xs text-amber-300/70 mt-1">
          This action requires your explicit confirmation before executing.
        </p>
      </div>

      {/* Content fields */}
      <div className="p-5 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sm text-zinc-400 block mb-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={content[field.key] ?? ''}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm min-h-[100px]"
                placeholder={field.placeholder}
              />
            ) : field.type === 'select' ? (
              <select
                value={content[field.key] ?? ''}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              >
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type !== 'hidden' ? (
              <input
                type="text"
                value={content[field.key] ?? ''}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                placeholder={field.placeholder}
              />
            ) : null}
          </div>
        ))}

        {/* Required scopes notice */}
        {template.required_scopes.length > 0 && (
          <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-3">
            Required permissions:{' '}
            {template.required_scopes.map((s) => (
              <span key={s} className="px-1.5 py-0.5 bg-zinc-800 rounded mr-1">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation buttons */}
      <div className="bg-zinc-800/50 border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={confirming}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          {schema.cancelLabel ?? 'Cancel'}
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 rounded text-sm font-medium transition-colors"
        >
          {confirming ? 'Executing…' : schema.confirmLabel ?? 'Confirm & Execute'}
        </button>
      </div>
    </div>
  );
}
