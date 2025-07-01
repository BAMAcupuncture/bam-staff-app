import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ToDo } from '../../types';
import { User, Calendar, Flag, Clock } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TodoCardProps {
  todo: ToDo;
}

const TodoCard: React.FC<TodoCardProps> = ({ todo }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
    data: { todo }, // Pass the full todo object in the drag event
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const isOverdue = todo.dueDate && isPast(todo.dueDate) && todo.status !== 'completed';
  const isDueToday = todo.dueDate && isToday(todo.dueDate);

  const getCategoryIcon = () => {
    switch (todo.category) {
      case 'consult_report': return '📋';
      case 'care_plan_initial': return '🏥';
      case 'chart_review': return '📊';
      case 'return_call': return '📞';
      case 'patient_engagement': return '👥';
      case 'new_lead_follow_up': return '🎯';
      default: return '📝';
    }
  };

  const getCategoryColor = () => {
    switch (todo.category) {
      case 'consult_report': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'care_plan_initial': return 'bg-green-100 text-green-800 border-green-200';
      case 'chart_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'return_call': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'patient_engagement': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'new_lead_follow_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2 scale-105 shadow-lg' : ''
      } ${isOverdue ? 'border-l-red-500 bg-red-50' : ''} ${isDueToday ? 'border-l-orange-500 bg-orange-50' : ''}`}
    >
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor()}`}>
          <span>{getCategoryIcon()}</span>
          <span className="capitalize">{todo.category.replace('_', ' ')}</span>
        </span>
        
        {/* Status indicator */}
        <div className={`w-3 h-3 rounded-full ${
          todo.status === 'completed' ? 'bg-green-500' :
          todo.status === 'in_progress' ? 'bg-blue-500' :
          'bg-gray-300'
        }`} title={`Status: ${todo.status.replace('_', ' ')}`} />
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{todo.title}</h4>
      
      {/* Patient name */}
      {todo.patientName && (
        <div className="flex items-center space-x-1 mb-2 text-sm text-gray-600">
          <User className="h-3 w-3" />
          <span>{todo.patientName}</span>
        </div>
      )}

      {/* Due date */}
      {todo.dueDate && (
        <div className={`flex items-center space-x-1 mb-2 text-sm ${
          isOverdue ? 'text-red-600 font-medium' :
          isDueToday ? 'text-orange-600 font-medium' :
          'text-gray-600'
        }`}>
          <Calendar className="h-3 w-3" />
          <span>
            {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : 'Due: '}
            {format(todo.dueDate, 'MMM d')}
          </span>
          {isOverdue && <Clock className="h-3 w-3 text-red-500" />}
        </div>
      )}

      {/* Sequence indicator */}
      {todo.isSequence && (
        <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          <Flag className="h-3 w-3" />
          <span>Step {todo.sequenceStep}</span>
        </div>
      )}

      {/* Priority indicator for high priority items */}
      {isOverdue && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          <span>Needs Attention</span>
        </div>
      )}
    </div>
  );
};

export default TodoCard;