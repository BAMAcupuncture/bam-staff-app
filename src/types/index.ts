export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Staff';
  uid: string;
  status: 'active' | 'terminated';
  terminatedDate?: Date;
  terminatedBy?: string;
  terminationReason?: string;
  isSystemAccount?: boolean;
  createdDate?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  goalId?: string;
  dueDate: Date;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Incomplete - Overdue';
  priority: 'Low' | 'Medium' | 'High';
  actionSteps: ActionStep[];
  completedBy?: string;
  completedDate?: Date;
  recurringTaskId?: string;
  isRecurringInstance?: boolean;
  overdueDate?: Date;
  createdDate?: Date;
}

export interface ActionStep {
  text: string;
  completed: boolean;
}

// NEW UNIFIED TO-DO INTERFACE
export interface ToDo {
  id: string;
  category: 
    | 'consult_report' 
    | 'care_plan_initial' 
    | 'chart_review'
    | 'return_call'
    | 'patient_engagement'
    | 'new_lead_follow_up';
  
  title: string;
  status: 'pending' | 'in_progress' | 'completed'; // Changed from boolean to status
  assigneeId: string | null;
  
  patientId?: string;
  patientName?: string;
  
  isSequence?: boolean;
  sequenceParentId?: string;
  sequenceStep?: number;
  
  dueDate?: Date;
  createdBy: string;
  createdDate: Date;
  completedDate?: Date;
}

// NEW TO-DO TEMPLATE INTERFACE
export interface ToDoTemplate {
  title: string;
  category: ToDo['category'];
  recurrence: 'daily' | 'weekly' | 'monthly';
}

// UPDATED GOAL INTERFACE
export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'bi-annual' | 'yearly';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdDate: Date;
  targetDate?: Date;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  progress: number;
  notes?: string;
  
  // --- ADD THESE NEW FIELDS ---
  isConstant?: boolean;
  toDoTemplates?: ToDoTemplate[];
}

// --- ENHANCED TO-DO LIST TYPES ---

export interface ToDoList {
  id: string;
  title: string;
  description?: string;
  type: 'personal' | 'shared' | 'department';
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  isArchived: boolean;
  color: string; // Hex color for visual organization
  order: number; // For custom ordering
  sharedWith?: string[]; // Array of user IDs for shared lists
  settings: {
    allowReordering: boolean;
    showCompletedItems: boolean;
    autoArchiveCompleted: boolean;
    requireDueDates: boolean;
  };
}

export interface ToDoItem {
  id: string;
  listId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedDate?: Date;
  completedBy?: string;
  createdBy: string;
  createdDate: Date;
  dueDate?: Date;
  priority: 'Low' | 'Medium' | 'High';
  order: number; // For drag-and-drop ordering
  tags?: string[]; // Optional tags for categorization
  assignedTo?: string; // For shared lists
  subtasks?: ToDoSubtask[];
  attachments?: ToDoAttachment[];
}

export interface ToDoSubtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface ToDoAttachment {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'note';
  addedDate: Date;
  addedBy: string;
}

// --- SPECIALIZED TO-DO TYPES (Legacy - for backward compatibility) ---

export interface JonathanToDoItem {
  id: string;
  type: 'care-plans' | 'charts-to-sign' | 'attention-needed';
  title: string;
  description?: string;
  patientName?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  createdBy: string;
  createdDate: Date;
  notes?: string;
}

export interface StaffToDoItem {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  completedBy?: string;
  createdBy: string;
  createdDate: Date;
  notes?: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  goalId?: string;
  priority: 'Low' | 'Medium' | 'High';
  recurrenceType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastProcessedDate?: Date;
  createdDate?: Date;
  isActive?: boolean;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  description?: string;
  taskId?: string; // Optional: to link to a specific task
  goalId?: string; // Optional: to link to a goal
  assigneeId?: string; // Optional: to show who is involved
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// --- AUDIT LOG INTERFACE ---
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED';
  collectionName: string;
  docId: string;
  changes: Record<string, any>; // Flexible object to store what changed
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
  };
}

export type ViewType = 'dashboard' | 'tasks' | 'calendar' | 'goals' | 'team' | 'analytics' | 'todo' | 'system';