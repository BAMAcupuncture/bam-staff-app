import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';

interface LogChanges {
  [key: string]: {
    from: any;
    to: any;
  };
}

export const logAction = async (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  user: User | null,
  collectionName: string,
  docId: string,
  changes: LogChanges = {}
) => {
  if (!user) return; // Don't log if user isn't defined

  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      userId: user.uid,
      userEmail: user.email || 'unknown@email.com',
      userName: user.displayName || 'Unknown User',
      action,
      collectionName,
      docId,
      changes,
      metadata: {
        userAgent: getUserAgent(),
        sessionId: generateSessionId()
      }
    });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};

// Enhanced logging functions for more detailed audit trails
export const logCreateAction = async (
  user: User | null,
  collectionName: string,
  docId: string,
  newData: Record<string, any>
) => {
  const changes: LogChanges = {};
  
  // For CREATE actions, all fields are "new"
  Object.keys(newData).forEach(key => {
    changes[key] = {
      from: null,
      to: newData[key]
    };
  });

  await logAction('CREATE', user, collectionName, docId, changes);
};

export const logUpdateAction = async (
  user: User | null,
  collectionName: string,
  docId: string,
  previousData: Record<string, any>,
  newData: Record<string, any>
) => {
  const changes: LogChanges = {};
  
  // Compare previous and new data to find actual changes
  const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);
  
  allKeys.forEach(key => {
    const oldValue = previousData[key];
    const newValue = newData[key];
    
    // Only log if there's an actual change
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue,
        to: newValue
      };
    }
  });

  // Only log if there are actual changes
  if (Object.keys(changes).length > 0) {
    await logAction('UPDATE', user, collectionName, docId, changes);
  }
};

export const logDeleteAction = async (
  user: User | null,
  collectionName: string,
  docId: string,
  deletedData: Record<string, any>
) => {
  const changes: LogChanges = {};
  
  // For DELETE actions, all fields are being removed
  Object.keys(deletedData).forEach(key => {
    changes[key] = {
      from: deletedData[key],
      to: null
    };
  });

  await logAction('DELETE', user, collectionName, docId, changes);
};

// Utility function to sanitize sensitive data before logging
export const sanitizeDataForLogging = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Batch logging for bulk operations
export const logBulkAction = async (
  user: User | null,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  collectionName: string,
  operations: Array<{
    docId: string;
    changes: LogChanges;
  }>
) => {
  if (!user || operations.length === 0) return;

  try {
    // Log each operation individually but with a batch identifier
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logPromises = operations.map(op => 
      addDoc(collection(db, 'auditLogs'), {
        timestamp: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email || 'unknown@email.com',
        userName: user.displayName || 'Unknown User',
        action,
        collectionName,
        docId: op.docId,
        changes: {
          ...op.changes,
          batchId,
          batchSize: operations.length
        },
        metadata: {
          userAgent: getUserAgent(),
          sessionId: generateSessionId()
        }
      })
    );

    await Promise.all(logPromises);
  } catch (error) {
    console.error("Failed to write bulk audit logs:", error);
  }
};

// Helper functions
function getUserAgent(): string {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
      return window.navigator.userAgent;
    }
    return 'Server/Build Environment';
  } catch (error) {
    return 'Unknown Environment';
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}