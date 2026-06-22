import { useEffect, useState } from "react";
import type { BoardPost, WithId } from "../types";
import type { PostBundle } from "./postService";

export function usePostBundle({ enabled }: { enabled: boolean }) {
  const [records, setRecords] = useState<Array<WithId<BoardPost>>>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => undefined as void;
    let cancelled = false;

    async function subscribe() {
      const [{ collection, doc, getDocs, onSnapshot }, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("../firebase"),
      ]);
      if (cancelled) {
        return;
      }

      unsubscribe = onSnapshot(doc(db, "postBundles", "current"), (snapshot) => {
        const bundle = snapshot.exists() ? (snapshot.data() as PostBundle) : null;
        if (bundle) {
          setRecords(bundle.posts);
          setLoading(false);
          return;
        }

        void getDocs(collection(db, "posts")).then((legacySnapshot) => {
          setRecords(
            legacySnapshot.docs.map((document) => ({
              id: document.id,
              ...(document.data() as BoardPost),
            })),
          );
          setLoading(false);
        });
      });
    }

    void subscribe();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled]);

  return { records, loading };
}
