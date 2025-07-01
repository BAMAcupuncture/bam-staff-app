import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLog } from '../types';

export class AuditService {
  private static instance: AuditService;
  private currentUser: { id: string; email: string; name: string } | null = null;

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public setCurrentUser(user: { id: string; email: string; name: string }) {
    this.currentUser = user;
  }

  public clearCurrentUser() {
    this.currentUser = null;
  }

  /**
   * Log a CREATE action
   */
  public async logCreate(
    collectionName: string,
    docId: string,
    newData: Record<string, any>,
    metadata?: AuditLog['metadata']
  ): Promise<void> {
    await this.createLog({
      action: 'CREATE',
      collectionName,
      docId,
      changes: {
        operation: 'CREATE',
        newData: this.sanitizeData(newData)
      },
      metadata
    });
  }

  /**
   * Log an UPDATE action
   */
  public async logUpdate(
    collectionName: string,
    docId: string,
    previousData: Record<string, any>,
    newData: Record<string, any>,
    metadata?: AuditLog['metadata']
  ): Promise<void> {
    const changes = this.calculateChanges(previousData, newData);
    
    if (Object.keys(changes).length === 0) {
      return; // No actual changes, don't log
    }

    await this.createLog({
      action: 'UPDATE',
      collectionName,
      docId,
      changes: {
        operation: 'UPDATE',
        fieldsChanged: Object.keys(changes),
        changes
      },
      metadata: {
        ...metadata,
        previousValues: this.sanitizeData(previousData),
        newValues: this.sanitizeData(newData)
      }
    });
  }

  /**
   * Log a DELETE action
   */
  public async logDelete(
    collectionName: string,
    docId: string,
    deletedData: Record<string, any>,
    metadata?: AuditLog['metadata']
  ): Promise<void> {
    await this.createLog({
      action: 'DELETE',
      collectionName,
      docId,
      changes: {
        operation: 'DELETE',
        deletedData: this.sanitizeData(deletedData)
      },
      metadata
    });
  }

  /**
   * Log authentication events
   */
  public async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED',
    details?: Record<string, any>,
    metadata?: AuditLog['metadata']
  ): Promise<void> {
    await this.createLog({
      action,
      collectionName: 'auth',
      docId: this.currentUser?.id || 'unknown',
      changes: {
        operation: action,
        details: details || {}
      },
      metadata
    });
  }

  /**
   * Log bulk operations
   */
  public async logBulkOperation(
    operation: string,
    collectionName: string,
    affectedDocIds: string[],
    details: Record<string, any>,
    metadata?: AuditLog['metadata']
  ): Promise<void> {
    await this.createLog({
      action: 'UPDATE',
      collectionName,
      docId: 'BULK_OPERATION',
      changes: {
        operation: `BULK_${operation.toUpperCase()}`,
        affectedDocuments: affectedDocIds,
        documentCount: affectedDocIds.length,
        details
      },
      metadata
    });
  }

  /**
   * Create the actual audit log entry
   */
  private async createLog(logData: {
    action: AuditLog['action'];
    collectionName: string;
    docId: string;
    changes: Record<string, any>;
    metadata?: AuditLog['metadata'];
  }): Promise<void> {
    if (!this.currentUser) {
      console.warn('AuditService: No current user set, skipping audit log');
      return;
    }

    try {
      const auditLogEntry: Omit<AuditLog, 'id'> = {
        timestamp: new Date(),
        userId: this.currentUser.id,
        userEmail: this.currentUser.email,
        userName: this.currentUser.name,
        action: logData.action,
        collectionName: logData.collectionName,
        docId: logData.docId,
        changes: logData.changes,
        metadata: {
          userAgent: this.getUserAgent(),
          sessionId: this.generateSessionId(),
          ...logData.metadata
        }
      };

      // Convert Date objects to Firestore Timestamps
      const firestoreData = {
        ...auditLogEntry,
        timestamp: Timestamp.fromDate(auditLogEntry.timestamp)
      };

      await addDoc(collection(db, 'auditLogs'), firestoreData);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should never break the main application flow
    }
  }

  /**
   * Safely get user agent - works in both browser and Node.js environments
   */
  private getUserAgent(): string {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
        return window.navigator.userAgent;
      }
      // Fallback for server-side rendering or Node.js environment
      return 'Server/Build Environment';
    } catch (error) {
      return 'Unknown Environment';
    }
  }

  /**
   * Calculate what changed between two objects
   */
  private calculateChanges(
    previous: Record<string, any>,
    current: Record<string, any>
  ): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    // Check for changed and new fields
    for (const key in current) {
      if (previous[key] !== current[key]) {
        changes[key] = {
          from: previous[key],
          to: current[key]
        };
      }
    }

    // Check for deleted fields
    for (const key in previous) {
      if (!(key in current)) {
        changes[key] = {
          from: previous[key],
          to: undefined
        };
      }
    }

    return changes;
  }

  /**
   * Remove sensitive data from objects before logging
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Also check for nested sensitive fields
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        if (sensitiveFields.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }

    return sanitized;
  }

  /**
   * Generate a session ID for tracking user sessions
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();