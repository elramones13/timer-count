export const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const getRandomColor = (): string => {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
};

export const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 4:
      return 'text-red-600 bg-red-50';
    case 3:
      return 'text-orange-600 bg-orange-50';
    case 2:
      return 'text-blue-600 bg-blue-50';
    case 1:
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'paused':
      return 'text-yellow-600 bg-yellow-50';
    case 'completed':
      return 'text-blue-600 bg-blue-50';
    case 'archived':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};
