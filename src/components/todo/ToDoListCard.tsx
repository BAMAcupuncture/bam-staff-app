import React from 'react';
import { MoreVertical, Plus, Users, User, Lock, Archive, Calendar, CheckSquare } from 'lucide-react';
import { ToDoList, ToDoItem } from '../../types';
import { format } from 'date-fns';

interface ToDoListCardProps {
  list: ToDoList;
  items: ToDoItem[];
  viewMode: 'grid' | 'list';
  onEdit: (list: ToDoList) => void;
  onAddItem: (listId: string) => void;
}

const ToDoListCard: React.FC<ToDoListCardProps> = ({
  list,
  items,
  viewMode,
  onEdit,
  onAddItem
}) => {
  const completedItems = items.filter(item => item.completed).length;
  const totalItems = items.length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getTypeIcon = () => {
    switch (list.type) {
      case 'personal': return <User className="h-4 w-4" />;
      case 'shared': return <Users className="h-4 w-4" />;
      case 'department': return <Lock className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (list.type) {
      case 'personal': return 'text-blue-600 bg-blue-100';
      case 'shared': return 'text-green-600 bg-green-100';
      case 'department': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Color indicator */}
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: list.color }}
            />
            
            {/* List info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{list.title}</h3>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
                  {getTypeIcon()}
                  <span className="capitalize">{list.type}</span>
                </div>
                {list.isArchived && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Archive className="h-3 w-3" />
                    <span>Archived</span>
                  </div>
                )}
              </div>
              
              {list.description && (
                <p className="text-sm text-gray-600 truncate">{list.description}</p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                <span>{completedItems} completed</span>
                <span>Modified {format(list.lastModified, 'MMM d')}</span>
              </div>
            </div>
          </div>

          {/* Progress and actions */}
          <div className="flex items-center space-x-4">
            {/* Progress */}
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-10 text-right">
                {completionPercentage}%
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onAddItem(list.id)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                title="Add item"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(list)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                title="Edit list"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
      style={{ borderTopColor: list.color, borderTopWidth: '4px' }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{list.title}</h3>
              {list.isArchived && (
                <Archive className="h-4 w-4 text-gray-400" />
              )}
            </div>
            
            {list.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{list.description}</p>
            )}
          </div>
          
          <button
            onClick={() => onEdit(list)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all duration-200"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Type and stats */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {getTypeIcon()}
            <span className="capitalize">{list.type}</span>
          </div>
          
          <div className="text-xs text-gray-500">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{completedItems} completed</span>
            <span>{totalItems - completedItems} remaining</span>
          </div>
        </div>

        {/* Recent items preview */}
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Recent Items</h4>
            <div className="space-y-1">
              {items.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center space-x-2 text-sm">
                  <div className={`w-3 h-3 rounded border flex-shrink-0 ${
                    item.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {item.completed && (
                      <CheckSquare className="h-2 w-2 text-white m-0.5" />
                    )}
                  </div>
                  <span className={`truncate ${
                    item.completed ? 'line-through text-gray-500' : 'text-gray-700'
                  }`}>
                    {item.title}
                  </span>
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-xs text-gray-500 pl-5">
                  +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Modified {format(list.lastModified, 'MMM d, yyyy')}
          </div>
          
          <button
            onClick={() => onAddItem(list.id)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToDoListCard;