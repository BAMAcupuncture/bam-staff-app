import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const useCollection = <T>(collectionName: string, queryConstraints?: any[]) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q = collection(db, collectionName);
    
    if (queryConstraints && queryConstraints.length > 0) {
      q = query(q, ...queryConstraints) as any;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to Date objects
          ...(doc.data().dueDate && { dueDate: doc.data().dueDate.toDate() }),
          ...(doc.data().createdDate && { createdDate: doc.data().createdDate.toDate() }),
          ...(doc.data().targetDate && { targetDate: doc.data().targetDate.toDate() }),
          ...(doc.data().lastReviewDate && { lastReviewDate: doc.data().lastReviewDate.toDate() }),
          ...(doc.data().nextReviewDate && { nextReviewDate: doc.data().nextReviewDate.toDate() }),
          ...(doc.data().completedDate && { completedDate: doc.data().completedDate.toDate() }),
          ...(doc.data().terminatedDate && { terminatedDate: doc.data().terminatedDate.toDate() })
        })) as T[];
        
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
};

export const useFirestoreOperations = (collectionName: string) => {
  const addDocument = async (data: any) => {
    try {
      const processedData = {
        ...data,
        ...(data.dueDate && isValidDate(data.dueDate) && { dueDate: Timestamp.fromDate(data.dueDate) }),
        ...(data.createdDate && isValidDate(data.createdDate) && { createdDate: Timestamp.fromDate(data.createdDate) }),
        ...(data.targetDate && isValidDate(data.targetDate) && { targetDate: Timestamp.fromDate(data.targetDate) }),
        ...(data.lastReviewDate && isValidDate(data.lastReviewDate) && { lastReviewDate: Timestamp.fromDate(data.lastReviewDate) }),
        ...(data.nextReviewDate && isValidDate(data.nextReviewDate) && { nextReviewDate: Timestamp.fromDate(data.nextReviewDate) }),
        ...(data.completedDate && isValidDate(data.completedDate) && { completedDate: Timestamp.fromDate(data.completedDate) }),
        ...(data.terminatedDate && isValidDate(data.terminatedDate) && { terminatedDate: Timestamp.fromDate(data.terminatedDate) })
      };
      
      const docRef = await addDoc(collection(db, collectionName), processedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (id: string, data: any) => {
    try {
      const processedData = {
        ...data,
        ...(data.dueDate && isValidDate(data.dueDate) && { dueDate: Timestamp.fromDate(data.dueDate) }),
        ...(data.createdDate && isValidDate(data.createdDate) && { createdDate: Timestamp.fromDate(data.createdDate) }),
        ...(data.targetDate && isValidDate(data.targetDate) && { targetDate: Timestamp.fromDate(data.targetDate) }),
        ...(data.lastReviewDate && isValidDate(data.lastReviewDate) && { lastReviewDate: Timestamp.fromDate(data.lastReviewDate) }),
        ...(data.nextReviewDate && isValidDate(data.nextReviewDate) && { nextReviewDate: Timestamp.fromDate(data.nextReviewDate) }),
        ...(data.completedDate && isValidDate(data.completedDate) && { completedDate: Timestamp.fromDate(data.completedDate) }),
        ...(data.terminatedDate && isValidDate(data.terminatedDate) && { terminatedDate: Timestamp.fromDate(data.terminatedDate) })
      };
      
      await updateDoc(doc(db, collectionName, id), processedData);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  return { addDocument, updateDocument, deleteDocument };
};