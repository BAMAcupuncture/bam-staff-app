import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase'; // Correctly import 'firestore'

// This hook was previously named useCollection in our discussion,
// but the error log refers to it as useFirestore.ts. This code will work for either.
const useFirestore = <T>(
  collectionName: string,
  condition?: [string, any, any],
  sort?: [string, any]
): { data: T[]; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let collectionRef: Query = collection(firestore, collectionName); // Use the 'firestore' variable

    // Apply where condition if provided
    if (condition && condition[1] && condition[2]) {
      collectionRef = query(collectionRef, where(condition[0], condition[1], condition[2]));
    }

    // Apply order by if provided
    if (sort && sort[0] && sort[1]) {
      collectionRef = query(collectionRef, orderBy(sort[0], sort[1]));
    }

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((doc) => {
        // Here we ensure the date fields from firestore are converted back to JS Date objects
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, JSON.stringify(condition), JSON.stringify(sort)]); // stringify to prevent re-renders

  return { data, loading };
};

export default useFirestore;