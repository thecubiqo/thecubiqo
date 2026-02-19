'use client';

import { useState } from 'react';

interface JourneyMemory {
  id: string;
  content: string;
  summary: string | null;
  category: string | null;
  importance_score: number;
  created_at: string;
}

interface JourneyPrivacyControlsProps {
  userId: string;
  memories: JourneyMemory[];
  onMemoryDeleted: (memoryId: string) => void;
  onAllDeleted: () => void;
}

export default function JourneyPrivacyControls({
  userId,
  memories,
  onMemoryDeleted,
  onAllDeleted,
}: JourneyPrivacyControlsProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  const handleDeleteMemory = async (memoryId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/journey/memories/${memoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }

      onMemoryDeleted(memoryId);
      setDeletingMemoryId(null);
    } catch (error) {
      
      alert('Failed to delete memory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/journey/consent?deleteMemories=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all memories');
      }

      onAllDeleted();
      setShowConfirmDelete(false);
    } catch (error) {
      
      alert('Failed to delete all memories');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Privacy Controls</h3>
          <p className="text-gray-400 mt-1">
            Manage your Journey memories and data
          </p>
        </div>
        <button
          onClick={() => setShowConfirmDelete(true)}
          disabled={loading || memories.length === 0}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Delete All Memories
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Memories</p>
          <p className="text-3xl font-bold text-white">{memories.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Oldest Memory</p>
          <p className="text-lg font-semibold text-white">
            {memories.length > 0
              ? formatDate(memories[memories.length - 1].created_at)
              : 'N/A'}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Newest Memory</p>
          <p className="text-lg font-semibold text-white">
            {memories.length > 0 ? formatDate(memories[0].created_at) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Memory List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-white">Your Memories</h4>
        </div>
        <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
          {memories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No memories stored yet
            </div>
          ) : (
            memories.map((memory) => (
              <div
                key={memory.id}
                className="p-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white line-clamp-2">{memory.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                      <span>{formatDate(memory.created_at)}</span>
                      {memory.category && (
                        <span className="px-2 py-0.5 bg-gray-700 rounded">
                          {memory.category}
                        </span>
                      )}
                      <span>
                        Importance: {Math.round(memory.importance_score * 100)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeletingMemoryId(memory.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500 rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              Delete All Memories?
            </h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete all {memories.length} memories. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Memory Confirmation */}
      {deletingMemoryId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500 rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              Delete Memory?
            </h3>
            <p className="text-gray-300 mb-6">
              This will permanently delete this memory. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMemoryId(null)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMemory(deletingMemoryId)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
