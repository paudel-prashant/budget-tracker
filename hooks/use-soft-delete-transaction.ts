"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TRANSACTION_UNDO_DELETE_MS } from "@/lib/config/undo-delete";
import type { Transaction } from "@/lib/types";

type PendingDelete = {
  transaction: Transaction;
  index: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

type UseSoftDeleteTransactionOptions = {
  onCommit: (id: string) => Promise<void>;
  showUndoToast: (message: string, onUndo: () => void) => void;
};

export function useSoftDeleteTransaction({
  onCommit,
  showUndoToast,
}: UseSoftDeleteTransactionOptions) {
  const pendingRef = useRef<Map<string, PendingDelete>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set());

  const syncPendingIds = useCallback(() => {
    setPendingIds(new Set(pendingRef.current.keys()));
  }, []);

  const commitNow = useCallback(
    async (id: string) => {
      const pending = pendingRef.current.get(id);
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      pendingRef.current.delete(id);
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
      }
      syncPendingIds();
      await onCommit(id);
    },
    [onCommit, syncPendingIds]
  );

  const flushActive = useCallback(async () => {
    if (activeIdRef.current) {
      await commitNow(activeIdRef.current);
    }
  }, [commitNow]);

  const cancelPending = useCallback(
    (id: string) => {
      const pending = pendingRef.current.get(id);
      if (!pending) return null;

      clearTimeout(pending.timeoutId);
      pendingRef.current.delete(id);
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
      }
      syncPendingIds();
      return pending;
    },
    [syncPendingIds]
  );

  const scheduleDelete = useCallback(
    async (
      transaction: Transaction,
      index: number,
      removeFromList: () => void,
      restoreToList: (tx: Transaction, atIndex: number) => void
    ) => {
      await flushActive();

      removeFromList();

      const timeoutId = setTimeout(() => {
        pendingRef.current.delete(transaction.id);
        if (activeIdRef.current === transaction.id) {
          activeIdRef.current = null;
        }
        syncPendingIds();
        void onCommit(transaction.id);
      }, TRANSACTION_UNDO_DELETE_MS);

      pendingRef.current.set(transaction.id, {
        transaction,
        index,
        timeoutId,
      });
      activeIdRef.current = transaction.id;
      syncPendingIds();

      showUndoToast(`"${transaction.title}" deleted`, () => {
        const restored = cancelPending(transaction.id);
        if (restored) {
          restoreToList(restored.transaction, restored.index);
        }
      });
    },
    [flushActive, cancelPending, onCommit, showUndoToast, syncPendingIds]
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const [id, item] of pending.entries()) {
        clearTimeout(item.timeoutId);
        void onCommit(id);
      }
      pending.clear();
    };
  }, [onCommit]);

  return { scheduleDelete, pendingIds };
}
