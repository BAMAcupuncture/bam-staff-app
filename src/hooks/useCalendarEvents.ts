import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from './useFirestore';
import { Task, Goal, TeamMember } from '../types';
import { isPast, isToday, addDays } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames?: string[];
  extendedProps: {
    type: 'task' | 'goal';
    data: Task | Goal;
    assignee?: string;
    priority?: Task['priority'];
    status?: Task['status'] | Goal['status'];
    progress?: number;
    isOverdue?: boolean;
    isToday?: boolean;
  };
}

export const useCalendarEvents = () => {
  const { userProfile } = useAuth();
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: goals, loading: goalsLoading } = useCollection<Goal>('goals');
  const { data: teamMembers, loading: teamLoading } = useCollection<TeamMember>('team');

  const events = useMemo((): CalendarEvent[] => {
    if (!userProfile || tasksLoading || goalsLoading || teamLoading) return [];

    const calendarEvents: CalendarEvent[] = [];

    // 1. Transform Tasks into Calendar Events
    tasks.forEach(task => {
      const assignee = teamMembers.find(member => member.id === task.assigneeId);
      const isOverdue = isPast(task.dueDate) && task.status !== 'Completed';
      const isDueToday = isToday(task.dueDate);
      
      // Determine event color based on status, priority, and assignment
      let backgroundColor: string;
      let borderColor: string;
      
      if (task.status === 'Completed') {
        backgroundColor = '#10b981'; // Green for completed
        borderColor = '#059669';
      } else if (isOverdue) {
        backgroundColor = '#ef4444'; // Red for overdue
        borderColor = '#dc2626';
      } else if (task.priority === 'High') {
        backgroundColor = '#f59e0b'; // Amber for high priority
        borderColor = '#d97706';
      } else if (task.priority === 'Medium') {
        backgroundColor = '#3b82f6'; // Blue for medium priority
        borderColor = '#2563eb';
      } else {
        backgroundColor = '#6b7280'; // Gray for low priority
        borderColor = '#4b5563';
      }

      // Adjust opacity for unassigned tasks
      if (!task.assigneeId) {
        backgroundColor = backgroundColor + '80'; // Add transparency
      }

      // Create task title with context
      let eventTitle = task.title;
      if (!task.assigneeId) {
        eventTitle = `🔓 ${task.title}`; // Open task indicator
      } else if (task.assigneeId === userProfile.id) {
        eventTitle = `📋 ${task.title}`; // My task indicator
      } else {
        eventTitle = `👤 ${task.title}`; // Someone else's task
      }

      calendarEvents.push({
        id: `task-${task.id}`,
        title: eventTitle,
        start: task.dueDate,
        allDay: true,
        backgroundColor,
        borderColor,
        textColor: 'white',
        classNames: [
          'cursor-pointer',
          'hover:opacity-80',
          'transition-opacity',
          task.status === 'Completed' ? 'opacity-75' : '',
          isOverdue ? 'animate-pulse' : ''
        ].filter(Boolean),
        extendedProps: {
          type: 'task',
          data: task,
          assignee: assignee?.name || 'Unassigned',
          priority: task.priority,
          status: task.status,
          isOverdue,
          isToday: isDueToday
        }
      });
    });

    // 2. Transform Goal Deadlines into Calendar Events
    goals.forEach(goal => {
      if (!goal.targetDate) return;

      const isOverdue = isPast(goal.targetDate) && goal.status === 'active';
      const isDueToday = isToday(goal.targetDate);
      
      let backgroundColor: string;
      let borderColor: string;
      
      if (goal.status === 'completed') {
        backgroundColor = '#10b981'; // Green for completed goals
        borderColor = '#059669';
      } else if (isOverdue) {
        backgroundColor = '#ef4444'; // Red for overdue goals
        borderColor = '#dc2626';
      } else if (goal.status === 'active') {
        backgroundColor = '#8b5cf6'; // Purple for active goals
        borderColor = '#7c3aed';
      } else {
        backgroundColor = '#6b7280'; // Gray for paused/cancelled
        borderColor = '#4b5563';
      }

      calendarEvents.push({
        id: `goal-${goal.id}`,
        title: `🎯 ${goal.title}`,
        start: goal.targetDate,
        allDay: true,
        backgroundColor,
        borderColor,
        textColor: 'white',
        classNames: [
          'cursor-pointer',
          'hover:opacity-80',
          'transition-opacity',
          goal.status === 'completed' ? 'opacity-75' : '',
          isOverdue ? 'animate-pulse' : ''
        ].filter(Boolean),
        extendedProps: {
          type: 'goal',
          data: goal,
          status: goal.status,
          progress: goal.progress,
          isOverdue,
          isToday: isDueToday
        }
      });
    });

    // 3. Add recurring reminders for important dates
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    // Add weekly review reminder (every Monday)
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
    
    if (nextMonday <= nextWeek) {
      calendarEvents.push({
        id: 'weekly-review',
        title: '📊 Weekly Review',
        start: nextMonday,
        allDay: true,
        backgroundColor: '#06b6d4',
        borderColor: '#0891b2',
        textColor: 'white',
        classNames: ['cursor-pointer', 'opacity-60'],
        extendedProps: {
          type: 'task',
          data: {
            id: 'weekly-review',
            title: 'Weekly Review',
            description: 'Review progress and plan for the upcoming week',
            status: 'Not Started',
            priority: 'Medium'
          } as Task,
          priority: 'Medium' as Task['priority'],
          status: 'Not Started' as Task['status']
        }
      });
    }

    return calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [userProfile, tasks, goals, teamMembers, tasksLoading, goalsLoading, teamLoading]);

  // Filter events by user preferences
  const getFilteredEvents = (filters?: {
    showMyTasks?: boolean;
    showOpenTasks?: boolean;
    showOthersTasks?: boolean;
    showGoals?: boolean;
    showCompleted?: boolean;
  }) => {
    if (!filters) return events;

    return events.filter(event => {
      const { type, data } = event.extendedProps;
      
      if (type === 'goal') {
        if (!filters.showGoals) return false;
        if (!filters.showCompleted && (data as Goal).status === 'completed') return false;
        return true;
      }
      
      if (type === 'task') {
        const task = data as Task;
        
        if (!filters.showCompleted && task.status === 'Completed') return false;
        
        if (task.assigneeId === userProfile?.id) {
          return filters.showMyTasks !== false;
        } else if (!task.assigneeId) {
          return filters.showOpenTasks !== false;
        } else {
          return filters.showOthersTasks !== false;
        }
      }
      
      return true;
    });
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = (days: number = 7) => {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate <= futureDate;
    }).slice(0, 10); // Limit to 10 events
  };

  // Get overdue items
  const getOverdueItems = () => {
    const today = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      const { type, data } = event.extendedProps;
      
      if (type === 'task') {
        const task = data as Task;
        return eventDate < today && task.status !== 'Completed';
      }
      
      if (type === 'goal') {
        const goal = data as Goal;
        return eventDate < today && goal.status === 'active';
      }
      
      return false;
    });
  };

  return {
    events,
    loading: tasksLoading || goalsLoading || teamLoading,
    getFilteredEvents,
    getEventsForDate,
    getUpcomingEvents,
    getOverdueItems,
    teamMembers
  };
};