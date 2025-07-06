import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query } from 'firebase/firestore';
import { firestore } from '../config/firebase';

const useCollection = <T,>(collectionName: string): { data: T[]; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionRef: Query = collection(firestore, collectionName);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        for (const key in docData) {
          if (docData[key]?.toDate && typeof docData[key].toDate === 'function') {
            docData[key] = docData[key].toDate();
          }
        }
        results.push({ id: doc.id, ...docData } as T);
      });
      setData(results);
      setLoading(false);
    }, (error) => {
      console.error(`Firestore error on collection ${collectionName}:`, error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);
  return { data, loading };
};

export default useCollection;