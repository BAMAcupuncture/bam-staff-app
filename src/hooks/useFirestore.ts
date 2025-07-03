import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Renaming the function back to useCollection to match what your components expect
const useCollection = <T>(
  collectionName: string,
  condition?: [string, any, any],
  sort?: [string, any]
): { data: T[]; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let collectionRef: Query = collection(firestore, collectionName);

    if (condition && condition[1] && condition[2]) {
      collectionRef = query(collectionRef, where(condition[0], condition[1], condition[2]));
    }

    if (sort && sort[0] && sort[1]) {
      collectionRef = query(collectionRef, orderBy(sort[0], sort[1]));
    }

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
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(condition), JSON.stringify(sort)]);

  return { data, loading };
};

// The file is named useFirestore.ts, but we export the function as useCollection
// to match the import statement in your other components.
export default useCollection;