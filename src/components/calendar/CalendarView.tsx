import React, { useState, useCallback } from 'react';
import FullCalendar, { DateClickArg, EventClickArg, EventDropArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useNavigate } from 'react-router-dom';
import { isToday } from 'date-fns';
import { Filter, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { useNotifications } from '../../context/NotificationContext';
import DailyFocusSidebar from './DailyFocusSidebar';
import TaskModal from '../tasks/TaskModal';
import Modal from '../ui/Modal';
import '../../styles/calendar.css';

// Simple Goal Detail Modal Component
const GoalDetailModal: React.FC<{ goal: any }> = ({ goal }) => (
  <div className="p-6">
    <p className="text-gray-700 mb-4">{goal.description}</p>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
          goal.status === 'active' ? 'bg-green-100 text-green-800' :
          goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {goal.status}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Type:</span>
        <span className="text-sm text-gray-900 capitalize">{goal.type}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Progress:</span>
        <span className="text-sm font-bold text-gray-900">{goal.progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
        <div 
          className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
          style={{ width: `${goal.progress}%` }}
        ></div>
      </div>
      
      {goal.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-600">Notes:</span>
          <p className="text-sm text-gray-700 mt-1">{goal.notes}</p>
        </div>
      )}
    </div>
  </div>
);

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { updateDocument } = useFirestoreOperations('tasks');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  
  // --- MODAL STATE MANAGEMENT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle] = useState('');
  
  // Event filters
  const [filters, setFilters] = useState({
    showMyTasks: true,
    showOpenTasks: true,
    showOthersTasks: false,
    showGoals: true,
    showCompleted: false
  });

  const { 
    events, 
    loading, 
    getFilteredEvents, 
    teamMembers 
  } = useCalendarEvents();

  const filteredEvents = getFilteredEvents(filters);

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalTitle('');
  };

  // --- INTERACTIVE HANDLERS ---
  const handleDateClick = useCallback((arg: DateClickArg) => {
    setSelectedDate(arg.date);
    
    // Open TaskModal to create a NEW task
    setModalTitle('Create New Task');
    setModalContent(
      <TaskModal
        onClose={closeModal}
        teamMembers={teamMembers}
        goalId={null} // No goal pre-selected when clicking a date
        onSuccess={() => {
          closeModal();
          addNotification({
            type: 'success',
            title: 'Task Created',
            message: 'New task has been created successfully.'
          });
        }}
      />
    );
    setIsModalOpen(true);
    
    // If clicking on today, show a helpful message
    if (isToday(arg.date)) {
      addNotification({
        type: 'info',
        title: 'Today Selected',
        message: 'Check the sidebar for your daily focus items.'
      });
    }
  }, [addNotification, teamMembers]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const { extendedProps } = clickInfo.event;
    
    if (extendedProps.type === 'task') {
      const task = extendedProps.data;
      
      // If it's a real task, open edit modal
      if (task.id !== 'weekly-review') {
        setModalTitle('Edit Task');
        setModalContent(
          <TaskModal
            task={task}
            onClose={closeModal}
            teamMembers={teamMembers}
            goalId={task.goalId}
            onSuccess={() => {
              closeModal();
              addNotification({
                type: 'success',
                title: 'Task Updated',
                message: 'Task has been updated successfully.'
              });
            }}
          />
        );
        setIsModalOpen(true);
      } else {
        // Handle special events like weekly review
        addNotification({
          type: 'info',
          title: 'Weekly Review',
          message: 'Time to review your progress and plan ahead!'
        });
      }
    } else if (extendedProps.type === 'goal') {
      const goal = extendedProps.data;
      setModalTitle(`Goal: ${goal.title}`);
      setModalContent(<GoalDetailModal goal={goal} />);
      setIsModalOpen(true);
    }
  }, [addNotification, teamMembers]);

  // Handle event drag and drop
  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const { event } = arg;
    
    if (event.extendedProps.type === 'task') {
      try {
        const taskId = event.id.replace('task-', '');
        await updateDocument(taskId, { 
          dueDate: event.start 
        });
        
        addNotification({
          type: 'success',
          title: 'Task Updated',
          message: `Task due date updated to ${event.start?.toLocaleDateString()}.`
        });
      } catch (error) {
        console.error("Failed to update task date:", error);
        arg.revert(); // Revert the event to its original position on failure
        
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update task due date.'
        });
      }
    } else {
      // Prevent dropping non-task events like Goals
      arg.revert();
      addNotification({
        type: 'warning',
        title: 'Cannot Move',
        message: 'Goal deadlines cannot be moved from the calendar.'
      });
    }
  }, [updateDocument, addNotification]);

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Handle adding new task
  const handleAddTask = () => {
    setModalTitle('Create New Task');
    setModalContent(
      <TaskModal
        onClose={closeModal}
        teamMembers={teamMembers}
        onSuccess={() => {
          closeModal();
          addNotification({
            type: 'success',
            title: 'Task Created',
            message: 'New task has been created successfully.'
          });
        }}
      />
    );
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      
      {/* Main Calendar Area */}
      <div className="flex-grow p-6 bg-white">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
              Daily Planner
            </h1>
            <p className="text-gray-600 mt-1">Your tasks and goals organized by day</p>
          </div>
          
          {/* Calendar Controls */}
          <div className="flex items-center space-x-4">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters && <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">ON</span>}
            </button>
            
            {/* Add Task Button */}
            <button
              onClick={handleAddTask}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Filters</h3>
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-blue-600">{filteredEvents.length}</span> of <span className="font-semibold">{events.length}</span> events
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { key: 'showMyTasks', label: 'My Tasks', icon: '📋', color: 'blue' },
                { key: 'showOpenTasks', label: 'Open Tasks', icon: '🔓', color: 'green' },
                { key: 'showOthersTasks', label: 'Others\' Tasks', icon: '👤', color: 'gray' },
                { key: 'showGoals', label: 'Goals', icon: '🎯', color: 'purple' },
                { key: 'showCompleted', label: 'Completed', icon: '✅', color: 'emerald' }
              ].map(filter => (
                <label key={filter.key} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters[filter.key as keyof typeof filters]}
                    onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
                    className={`rounded border-gray-300 text-${filter.color}-600 focus:ring-${filter.color}-500 transition-colors`}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <span className="mr-2">{filter.icon}</span>
                    {filter.label}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Tip: Use filters to focus on specific types of events and reduce visual clutter
              </div>
              <button
                onClick={() => setFilters({
                  showMyTasks: true,
                  showOpenTasks: true,
                  showOthersTasks: false,
                  showGoals: true,
                  showCompleted: false
                })}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* Calendar with Day and Week Views */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              // Added dayGridWeek and dayGridDay for simplified all-day views
              right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek'
            }}
            events={filteredEvents}
            editable={true}
            droppable={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="auto"
            dayMaxEvents={4}
            moreLinkClick="popover"
            eventDisplay="block"
            displayEventTime={false}
            eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
            dayCellClassNames={(arg) => {
              return isToday(arg.date) ? 'bg-blue-50 border-blue-200' : '';
            }}
            eventDidMount={(info) => {
              // Add tooltips to events
              const { extendedProps } = info.event;
              if (extendedProps.type === 'task') {
                const task = extendedProps.data;
                info.el.title = `${task.title}\nPriority: ${extendedProps.priority}\nStatus: ${extendedProps.status}\nAssigned to: ${extendedProps.assignee}`;
              } else if (extendedProps.type === 'goal') {
                const goal = extendedProps.data;
                info.el.title = `${goal.title}\nProgress: ${extendedProps.progress}%\nStatus: ${extendedProps.status}`;
              }
            }}
            eventContent={(eventInfo) => {
              const { extendedProps } = eventInfo.event;
              return (
                <div className="fc-event-main-frame">
                  <div className="fc-event-title-container">
                    <div className="fc-event-title fc-sticky">
                      {eventInfo.event.title}
                      {extendedProps.isOverdue && (
                        <span className="ml-1 text-xs">⚠️</span>
                      )}
                      {extendedProps.isToday && (
                        <span className="ml-1 text-xs">📅</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Enhanced Legend */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
              <span>Overdue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded shadow-sm"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded shadow-sm"></div>
              <span>Low Priority</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded shadow-sm"></div>
              <span>Goals</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span>📋 My Tasks</span>
              <span>🔓 Open Tasks</span>
              <span>👤 Others' Tasks</span>
              <span>🎯 Goals</span>
              <span>⚠️ Overdue</span>
              <span>📅 Due Today</span>
            </div>
          </div>
        </div>

        {/* Daily Planning Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📅 Daily Planning Tips</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Click on any date to see your daily focus items in the sidebar</p>
            <p>• Drag tasks to different dates to reschedule them</p>
            <p>• Use filters to focus on specific types of work</p>
            <p>• Switch between Month, Week, and Day views using the buttons above</p>
            <p>• Claim open tasks directly from the sidebar</p>
            <p>• Goals show as purple events on their target dates</p>
          </div>
        </div>
      </div>

      {/* Daily Focus Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-y-auto shadow-inner">
        <DailyFocusSidebar 
          selectedDate={selectedDate} 
          onAddTask={handleAddTask}
        />
      </div>

      {/* --- RENDER THE MODAL DYNAMICALLY --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={modalTitle}
        size="lg"
      >
        {modalContent}
      </Modal>

    </div>
  );
};

export default CalendarView;