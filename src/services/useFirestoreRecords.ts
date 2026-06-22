import { useEffect, useState } from "react";
import type { WithId } from "../types";

interface UseFirestoreRecordsOptions {
  collectionName: string;
  enabled: boolean;
  ownerField?: string;
  ownerUid?: string;
  filters?: ReadonlyArray<{
    field: string;
    op: "==";
    value: unknown;
  }>;
}

const EMPTY_FILTERS: NonNullable<UseFirestoreRecordsOptions["filters"]> = [];

export function useFirestoreRecords<T>({
  collectionName,
  enabled,
  ownerField,
  ownerUid,
  filters = EMPTY_FILTERS,
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
      const constraints = filters.map((filter) => where(filter.field, filter.op, filter.value));
      if (ownerField && ownerUid) {
        constraints.unshift(where(ownerField, "==", ownerUid));
      }
      const target = constraints.length > 0 ? query(base, ...constraints) : base;
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
  }, [collectionName, enabled, filters, ownerField, ownerUid]);

  return { records, loading };
}
