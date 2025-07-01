import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ToDo } from '../../types';
import TodoCard from './TodoCard';
import { Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TodoColumnProps {
  id: string;
  title: string;
  todos: ToDo[];
  color?: string;
  onAddTodo?: () => void;
}

const TodoColumn: React.FC<TodoColumnProps> = ({ 
  id, 
  title, 
  todos, 
  color = 'blue',
  onAddTodo 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const getColumnIcon = () => {
    switch (id) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'in_progress': return <AlertCircle className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getColumnColor = () => {
    switch (id) {
      case 'pending': return 'border-gray-300 bg-gray-50';
      case 'in_progress': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getHeaderColor = () => {
    switch (id) {
      case 'pending': return 'text-gray-700 bg-gray-100';
      case 'in_progress': return 'text-blue-700 bg-blue-100';
      case 'completed': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="flex-1 min-w-80 max-w-sm">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-4 rounded-t-lg border-b-2 ${getHeaderColor()}`}>
        <div className="flex items-center space-x-2">
          {getColumnIcon()}
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
            {todos.length}
          </span>
        </div>
        
        {onAddTodo && id === 'pending' && (
          <button
            onClick={onAddTodo}
            className="p-1 hover:bg-white hover:bg-opacity-50 rounded-md transition-colors"
            title="Add new todo"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`min-h-96 p-4 rounded-b-lg border-2 border-dashed transition-all duration-200 ${
          isOver 
            ? 'border-blue-400 bg-blue-100 shadow-inner' 
            : getColumnColor()
        }`}
      >
        {/* Todo Cards */}
        <div className="space-y-3">
          {todos.map(todo => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>

        {/* Empty State */}
        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            {getColumnIcon()}
            <p className="text-sm mt-2">No items</p>
            {id === 'pending' && (
              <p className="text-xs mt-1">Drag items here or click + to add</p>
            )}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isOver && (
          <div className="mt-4 p-4 border-2 border-blue-400 border-dashed rounded-lg bg-blue-50">
            <p className="text-blue-600 text-center font-medium">Drop here to move item</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoColumn;