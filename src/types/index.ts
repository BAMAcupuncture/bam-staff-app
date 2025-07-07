export interface TeamMember {
  id: string; // Document ID (same as uid)
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  status: 'active' | 'terminated';
  isSystemAccount?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'completed' | 'paused';
  createdDate: Date;
  targetDate: Date;
  progress: number; // 0 - 100
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  goalId?: string;
  dueDate: Date;
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

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
  status: 'pending' | 'in_progress' | 'completed';
  assigneeId: string | null;
  patientName?: string;
  dueDate?: Date;
  createdBy: string;
  createdDate: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  collectionName: string;
  docId: string;
  changes: Record<string, any>;
}