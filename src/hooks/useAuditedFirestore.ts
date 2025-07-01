import { useCallback, useEffect } from 'react';
import { useFirestoreOperations } from './useFirestore';
import { auditService } from '../services/auditService';
import { useAuth } from '../context/AuthContext';

/**
 * Enhanced Firestore operations hook that automatically logs all changes
 */
export const useAuditedFirestore = (collectionName: string) => {
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations(collectionName);
  const { userProfile } = useAuth();

  // Set current user for audit service
  useEffect(() => {
    if (userProfile) {
      auditService.setCurrentUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name
      });
    } else {
      auditService.clearCurrentUser();
    }
  }, [userProfile]);

  const auditedAddDocument = useCallback(async (data: any, metadata?: any) => {
    try {
      const docId = await addDocument(data);
      
      // Log the creation
      await auditService.logCreate(collectionName, docId, data, metadata);
      
      return docId;
    } catch (error) {
      console.error(`Failed to add document to ${collectionName}:`, error);
      throw error;
    }
  }, [addDocument, collectionName]);

  const auditedUpdateDocument = useCallback(async (
    id: string, 
    data: any, 
    previousData?: any,
    metadata?: any
  ) => {
    try {
      await updateDocument(id, data);
      
      // Log the update
      if (previousData) {
        await auditService.logUpdate(collectionName, id, previousData, data, metadata);
      } else {
        // If we don't have previous data, log as a general update
        await auditService.logUpdate(collectionName, id, {}, data, metadata);
      }
    } catch (error) {
      console.error(`Failed to update document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }, [updateDocument, collectionName]);

  const auditedDeleteDocument = useCallback(async (
    id: string, 
    documentData?: any,
    metadata?: any
  ) => {
    try {
      await deleteDocument(id);
      
      // Log the deletion
      await auditService.logDelete(collectionName, id, documentData || {}, metadata);
    } catch (error) {
      console.error(`Failed to delete document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }, [deleteDocument, collectionName]);

  return {
    addDocument: auditedAddDocument,
    updateDocument: auditedUpdateDocument,
    deleteDocument: auditedDeleteDocument,
    // Also expose the original methods for cases where audit is not needed
    originalAddDocument: addDocument,
    originalUpdateDocument: updateDocument,
    originalDeleteDocument: deleteDocument
  };
};