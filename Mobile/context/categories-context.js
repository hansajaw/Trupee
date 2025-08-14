import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "CATEGORIES_V1"; 

const DEFAULTS = [
  { name: "Groceries",         color: "#22C55E", group: "Expense", type: "Need" },
  { name: "Bills & Utilities", color: "#3B82F6", group: "Expense", type: "Need" },
  { name: "Transport",         color: "#10B981", group: "Expense", type: "Need" },
  { name: "Healthcare",        color: "#EF4444", group: "Expense", type: "Must" },
  { name: "Education",         color: "#8B5CF6", group: "Expense", type: "Must" },
  { name: "Savings",           color: "#F59E0B", group: "Expense", type: "Must" },
  { name: "Dining Out",        color: "#A78BFA", group: "Expense", type: "Want" },
  { name: "Entertainment",     color: "#F472B6", group: "Expense", type: "Want" },
  { name: "Shopping",          color: "#60A5FA", group: "Expense", type: "Want" },

  { name: "Salary",     color: "#16A34A", group: "Income" },
  { name: "Bonus",      color: "#22C55E", group: "Income" },
  { name: "Interest",   color: "#10B981", group: "Income" },
  { name: "Dividends",  color: "#34D399", group: "Income" },
  { name: "Freelance",  color: "#2DD4BF", group: "Income" },
  { name: "Refunds",    color: "#86EFAC", group: "Income" },
  { name: "Gifts",      color: "#A7F3D0", group: "Income" },

  { name: "Personal",   color: "#F59E0B", group: "Loan" },
  { name: "Education",  color: "#3B82F6", group: "Loan" },
  { name: "Vehicle",    color: "#8B5CF6", group: "Loan" },
  { name: "Home",       color: "#EF4444", group: "Loan" },
  { name: "Business",   color: "#10B981", group: "Loan" },
  { name: "Other",      color: "#64748B", group: "Loan" },
];

const CategoriesContext = createContext({
  categories: [],
  setCategories: (_list) => {},
  addCategory: (_cat) => {},
  updateCategory: (_name, _patch) => {},
  deleteCategory: (_name) => {},
  getByGroup: (_group) => [],
  getExpenseCategories: () => [],
  getIncomeCategories: () => [],
  getLoanCategories: () => [],
  getExpenseByPriority: (_priority) => [],
});

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setCategories(DEFAULTS);
        } else {
          let parsed = [];
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = [];
          }
          if (!Array.isArray(parsed) || parsed.length === 0) {
            setCategories(DEFAULTS);
          } else {
            const migrated = parsed.map((c) => ({
              group: "Expense",
              ...c,
              group: c.group || "Expense",
            }));
            setCategories(migrated);
          }
        }
      } catch {
        setCategories(DEFAULTS);
      } finally {
        loadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      } catch {}
    })();
  }, [categories]);

  const addCategory = (cat) => {
    if (!cat?.name || !cat?.group) return;
    setCategories((prev) => {
      if (prev.some((c) => c.name.toLowerCase() === cat.name.toLowerCase() && c.group === cat.group)) {
        return prev; 
      }
      return [...prev, { color: "#22C55E", ...cat }];
    });
  };

  const updateCategory = (name, patch) => {
    setCategories((prev) =>
      prev.map((c) => (c.name === name && (!patch.group || patch.group === c.group) ? { ...c, ...patch } : c))
    );
  };

  const deleteCategory = (name, group) => {
    setCategories((prev) => prev.filter((c) => !(c.name === name && (group ? c.group === group : true))));
  };

  const getByGroup = (group) => categories.filter((c) => c.group === group);
  const getExpenseCategories = () => getByGroup("Expense");
  const getIncomeCategories = () => getByGroup("Income");
  const getLoanCategories = () => getByGroup("Loan");
  const getExpenseByPriority = (priority) =>
    categories.filter((c) => c.group === "Expense" && c.type === priority);

  const value = useMemo(
    () => ({
      categories,
      setCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      getByGroup,
      getExpenseCategories,
      getIncomeCategories,
      getLoanCategories,
      getExpenseByPriority,
    }),
    [categories]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};

export const useCategories = () => useContext(CategoriesContext);
