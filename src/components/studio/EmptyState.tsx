'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = '📝', title, description, action }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-900/50">
      <div className="text-center max-w-md px-8">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
