"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

type QuickTransactionContextValue = {
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
};

const QuickTransactionContext = createContext<QuickTransactionContextValue | null>(null);

type QuickTransactionProviderProps = {
  children: ReactNode;
  onCreated?: () => void;
};

export function QuickTransactionProvider({ children, onCreated }: QuickTransactionProviderProps) {
  const [open, setOpen] = useState(false);

  const openQuickAdd = useCallback(() => setOpen(true), []);
  const closeQuickAdd = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openQuickAdd, closeQuickAdd }),
    [openQuickAdd, closeQuickAdd]
  );

  return (
    <QuickTransactionContext.Provider value={value}>
      {children}
      <TransactionFormDialog
        open={open}
        onClose={closeQuickAdd}
        onSuccess={async () => {
          closeQuickAdd();
          onCreated?.();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("budgetrax:transactions-changed"));
          }
        }}
      />
    </QuickTransactionContext.Provider>
  );
}

export function useQuickTransaction() {
  const ctx = useContext(QuickTransactionContext);
  if (!ctx) {
    throw new Error("useQuickTransaction must be used within QuickTransactionProvider");
  }
  return ctx;
}
