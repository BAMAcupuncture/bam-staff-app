import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useCollection, useFirestoreOperations } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ToDo } from '../../types';
import TodoColumn from './TodoColumn';
import TodoCard from './TodoCard';
import { Plus, Filter, Users, User } from 'lucide-react';
import { logUpdateAction } from '../../services/loggingService';

type ColumnId = 'pending' | 'in_progress' | 'completed';

const KanbanBoard: React.FC = () => {
  const { userProfile, user } = useAuth();
  const { data: allTodos, loading } = useCollection<ToDo>('todos');
  const { updateDocument } = useFirestoreOperations('todos');
  const { addNotification } = useNotifications();

  const [columns, setColumns] = useState<Record<ColumnId, ToDo[]>>({
    pending: [],
    in_progress: [],
    completed: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedTodo, setDraggedTodo] = useState<ToDo | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'mine' | 'unassigned'>('all');

  // Filter todos based on assignee filter
  const filteredTodos = React.useMemo(() => {
    if (!allTodos || !userProfile) return [];

    return allTodos.filter(todo => {
      switch (filterAssignee) {
        case 'mine':
          return todo.assigneeId === userProfile.id;
        case 'unassigned':
          return !todo.assigneeId;
        case 'all':
        default:
          return true;
      }
    });
  }, [allTodos, userProfile, filterAssignee]);

  // Update columns when todos change
  useEffect(() => {
    if (filteredTodos) {
      const pending = filteredTodos.filter(t => t.status === 'pending');
      const in_progress = filteredTodos.filter(t => t.status === 'in_progress');
      const completed = filteredTodos.filter(t => t.status === 'completed');
      
      setColumns({ pending, in_progress, completed });
    }
  }, [filteredTodos]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged todo
    const todo = filteredTodos.find(t => t.id === active.id);
    setDraggedTodo(todo || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    
    setActiveId(null);
    setDraggedTodo(null);

    if (!over) return;

    const todoId = active.id as string;
    const newStatus = over.id as ColumnId;
    
    // Find the todo being moved
    const todo = filteredTodos.find(t => t.id === todoId);
    if (!todo || todo.status === newStatus) return;

    // Store the previous data for audit logging
    const previousData = { ...todo };
    const newData = { ...todo, status: newStatus };

    try {
      // Update the todo status in Firestore
      const updateData: Partial<ToDo> = {
        status: newStatus,
        ...(newStatus === 'completed' && { completedDate: new Date() })
      };

      await updateDocument(todoId, updateData);
      
      // Log the update action
      await logUpdateAction(
        user,
        'todos',
        todoId,
        previousData,
        { ...previousData, ...updateData }
      );
      
      addNotification({
        type: 'success',
        title: 'Todo Updated',
        message: `"${todo.title}" moved to ${newStatus.replace('_', ' ')}.`
      });
    } catch (error) {
      console.error("Failed to update todo:", error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to move todo. Please try again.'
      });
    }
  };

  const handleAddTodo = () => {
    // This would open a modal to create a new todo
    addNotification({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Todo creation modal will be implemented next.'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Operations Board</h2>
          <p className="text-gray-600 mt-1">Drag and drop todos to update their status</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Assignee Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Todos</option>
              <option value="mine">My Todos</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          {/* Add Todo Button */}
          <button
            onClick={handleAddTodo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Todo</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{columns.pending.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{columns.in_progress.length}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{columns.completed.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          <TodoColumn 
            id="pending" 
            title="To-Do" 
            todos={columns.pending}
            onAddTodo={handleAddTodo}
          />
          <TodoColumn 
            id="in_progress" 
            title="In Progress" 
            todos={columns.in_progress}
          />
          <TodoColumn 
            id="completed" 
            title="Completed" 
            todos={columns.completed}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedTodo ? (
            <div className="rotate-3 scale-105">
              <TodoCard todo={draggedTodo} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredTodos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No todos found</h3>
          <p className="text-gray-600 mb-4">
            {filterAssignee === 'mine' 
              ? 'You don\'t have any todos assigned yet.'
              : filterAssignee === 'unassigned'
              ? 'No unassigned todos available.'
              : 'No todos have been created yet.'
            }
          </p>
          <button
            onClick={handleAddTodo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Todo
          </button>
        </div>
      )}

      {/* Usage Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How to Use the Board</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Drag & Drop:</strong> Move todos between columns to update their status</p>
          <p>• <strong>Color Coding:</strong> Different categories have unique colors and icons</p>
          <p>• <strong>Filters:</strong> Use the dropdown to view specific todos (yours, unassigned, or all)</p>
          <p>• <strong>Patient Context:</strong> Patient names are shown when applicable</p>
          <p>• <strong>Due Dates:</strong> Overdue items are highlighted in red</p>
          <p>• <strong>Audit Trail:</strong> All status changes are automatically logged for compliance</p>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;