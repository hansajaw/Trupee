import React, { createContext, useContext, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TxCtx = createContext(null);

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);

  const balance = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions]
  );

  const addTransaction = (tx) => {
    setTransactions((prev) => {
      const safe = {
        id: tx.id || String(Date.now()),
        date: tx.date || new Date().toISOString(),
        amount: Number(tx.amount),
        ...tx,
      };
      const next = [...prev, safe];
      AsyncStorage.setItem("TX", JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const value = { transactions, balance, addTransaction };
  return <TxCtx.Provider value={value}>{children}</TxCtx.Provider>;
}

export const useTransactions = () => useContext(TxCtx);
