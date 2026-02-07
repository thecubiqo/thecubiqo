'use client'

/**
 * Journal Entry Component
 * Display and interact with a single journal entry
 */

import { useState } from 'react';
import type { JournalEntry as JournalEntryType } from '@/lib/journal/types';

interface JournalEntryProps {
  entry: JournalEntryType;
  onEdit?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
}

const colorStyles = {
  RED: 'bg-red-500/20 border-red-500/50 text-red-100',
  YELLOW: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100',
  GREEN_BLUE: 'bg-green-500/20 border-green-500/50 text-green-100',
};

const colorLabels = {
  RED: '🔴 Red - Urgent/Important',
  YELLOW: '🟡 Yellow - Daily/Candid',
  GREEN_BLUE: '🟢 Green - Focused/Driven',
};

export default function JournalEntry({ entry, onEdit, onDelete }: JournalEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSave = () => {
    if (onEdit && editContent !== entry.content) {
      onEdit(entry.id, { content: editContent });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(entry.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 mb-4 ${colorStyles[entry.colorCategory]}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-sm">
            {colorLabels[entry.colorCategory]}
          </div>
          <div className="text-xs opacity-70 mt-1">
            {formatDate(entry.timestamp)} - {formatTime(entry.timestamp)}
          </div>
        </div>
        <div className="flex gap-2">
          {entry.type === 'voice' && (
            <span className="text-xs px-2 py-1 rounded bg-purple-500/30">
              🎤 Voice
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full bg-black/30 border border-white/20 rounded p-2 text-sm min-h-[100px]"
          autoFocus
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">
          {entry.content}
        </p>
      )}

      {/* Keywords */}
      {entry.keywords && entry.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {entry.keywords.slice(0, 5).map((keyword, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded bg-white/10"
            >
              #{keyword}
            </span>
          ))}
        </div>
      )}

      {/* Mood */}
      {entry.mood && (
        <div className="text-xs opacity-70 mb-3">
          Mood: {entry.mood}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/10">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1 rounded bg-green-500/30 hover:bg-green-500/50"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-xs px-3 py-1 rounded bg-gray-500/30 hover:bg-gray-500/50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs px-3 py-1 rounded hover:bg-white/10"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this entry?')) {
                    onDelete(entry.id);
                  }
                }}
                className="text-xs px-3 py-1 rounded hover:bg-red-500/30"
              >
                Delete
              </button>
            )}
          </>
        )}

        <div className="flex-1" />
        
        {/* Word count */}
        <span className="text-xs opacity-50">
          {entry.metadata.wordCount} words
        </span>
      </div>
    </div>
  );
}
