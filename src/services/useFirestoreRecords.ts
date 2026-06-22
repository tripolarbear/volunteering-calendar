import { useEffect, useState } from "react";
import type { WithId } from "../types";

interface UseFirestoreRecordsOptions {
  collectionName: string;
  enabled: boolean;
  ownerField?: string;
  ownerUid?: string;
}

export function useFirestoreRecords<T>({
  collectionName,
  enabled,
  ownerField,
  ownerUid,
}: UseFirestoreRecordsOptions) {
  const [records, setRecords] = useState<Array<WithId<T>>>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => undefined as void;
    let cancelled = false;

    async function subscribe() {
      const [{ collection, onSnapshot, query, where }, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("../firebase"),
      ]);
      if (cancelled) {
        return;
      }

      const base = collection(db, collectionName);
      const target = ownerField && ownerUid ? query(base, where(ownerField, "==", ownerUid)) : base;
      unsubscribe = onSnapshot(target, (snapshot) => {
        setRecords(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as T),
          })),
        );
        setLoading(false);
      });
    }

    void subscribe();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [collectionName, enabled, ownerField, ownerUid]);

  return { records, loading };
}
