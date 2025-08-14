import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";                
import { useTheme } from "../context/theme-context";
import { useCategories } from "../context/categories-context";
import i18n from "../i18n";

const PLANS_KEY = "BUDGET_PLANS";
const currentMonth = () => new Date().toISOString().slice(0, 7);
const isMonth = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m || "");

export default function BudgetPlans() {
  const router = useRouter();                         
  const { theme } = useTheme();
  const { categories } = useCategories();

  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);


  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState([{ name: "", category: "", amount: "" }]);
  const [editIndex, setEditIndex] = useState(null);
  const [openCategoryIndex, setOpenCategoryIndex] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLANS_KEY);
        if (raw) setPlans(JSON.parse(raw));
      } catch (e) {
        console.log("load plans error", e);
      }
    })();
  }, []);

  const persistPlans = async (next) => {
    setPlans(next);
    try {
      await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("save plans error", e);
    }
  };


  const resetForm = () => {
    setTitle("");
    setMonth(currentMonth());
    setExpenses([{ name: "", category: "", amount: "" }]);
    setEditIndex(null);
    setOpenCategoryIndex(null);
  };

  const calculateTotal = () =>
    expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const handleSave = () => {
    if (!title || expenses.some((e) => !e.category || !e.amount)) {
      Alert.alert(i18n.t("error") || "Error", i18n.t("fillAllFields") || "Please fill in all required fields");
      return;
    }
    if (!isMonth(month)) {
      Alert.alert(i18n.t("invalidMonth") || "Invalid Month", i18n.t("useYYYYMM") || "Use format YYYY-MM (e.g., 2025-08).");
      return;
    }

    const cleanExpenses = expenses.map((e) => ({
      ...e,
      amount: String(Math.max(0, Number(e.amount) || 0)),
    }));

    const newPlan = {
      id: editIndex !== null && plans[editIndex]?.id ? plans[editIndex].id : Date.now().toString(),
      month,
      title,
      expenses: cleanExpenses,
      total: cleanExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0),
    };

    if (editIndex !== null) {
      const updated = [...plans];
      updated[editIndex] = newPlan;
      persistPlans(updated);
    } else {
      persistPlans([...plans, newPlan]);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (index) => {
    const plan = plans[index];
    setTitle(plan.title);
    setMonth(plan.month || currentMonth());
    setExpenses(plan.expenses);
    setEditIndex(index);
    setShowModal(true);
  };

  const handleDelete = (index) => {
    Alert.alert(
      i18n.t("deleteBudgetPlan") || "Delete Budget Plan",
      i18n.t("deleteBudgetPlanConfirm") || "Are you sure you want to delete this plan?",
      [
        { text: i18n.t("cancel") || "Cancel", style: "cancel" },
        {
          text: i18n.t("delete") || "Delete",
          style: "destructive",
          onPress: () => persistPlans(plans.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const addExpense = () => {
    setExpenses([...expenses, { name: "", category: "", amount: "" }]);
  };

  const updateExpense = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const deleteExpense = (index) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={[styles.iconBtn, { backgroundColor: theme.white, borderColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textDark }]}>
          {i18n.t("budgetPlans") || "Budget Plans"}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {i18n.t("noBudgetPlans") || "No budget plans yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...plans].sort((a, b) => (a.month || "").localeCompare(b.month || ""))}
          keyExtractor={(item) => item.id || String(item.title) + item.month}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.textDark }]}>{item.title}</Text>
              <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>
                {i18n.t("month") || "Month"}: {item.month || "-"}
              </Text>
              {item.expenses.map((e, i) => (
                <Text key={i} style={[styles.planExpense, { color: theme.textDark }]}>
                  {e.name || e.category} ({e.category}): LKR {(Number(e.amount) || 0).toLocaleString()}
                </Text>
              ))}
              <Text style={[styles.planTotal, { color: theme.textDark }]}>
                {i18n.t("total") || "Total"}: LKR {Number(item.total || 0).toLocaleString()}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(index)}>
                  <Ionicons name="create-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)}>
                  <Ionicons name="trash-outline" size={22} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
              <ScrollView>
                <Text style={[styles.modalTitle, { color: theme.textDark }]}>
                  {editIndex !== null
                    ? i18n.t("editBudgetPlan") || "Edit Budget Plan"
                    : i18n.t("addBudgetPlan") || "Add Budget Plan"}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textDark },
                  ]}
                  placeholder={i18n.t("planTitle") || "Plan Title"}
                  placeholderTextColor={theme.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />

                <TextInput
                  style={[
                    styles.input,
                    { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textDark },
                  ]}
                  placeholder={i18n.t("monthYYYYMM") || "Month (YYYY-MM)"}
                  placeholderTextColor={theme.placeholderText}
                  value={month}
                  onChangeText={setMonth}
                />

                {expenses.map((e, index) => (
                  <View key={index} style={[styles.expenseCart, { borderColor: theme.border }]}>
                    <TextInput
                      style={[
                        styles.expenseNameInput,
                        { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textDark },
                      ]}
                      placeholder={i18n.t("expenseName") || "Expense Name"}
                      placeholderTextColor={theme.placeholderText}
                      value={e.name}
                      onChangeText={(text) => updateExpense(index, "name", text)}
                    />

                    <TouchableOpacity
                      style={[
                        styles.input,
                        {
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 10,
                          borderColor: theme.border,
                          backgroundColor: theme.inputBackground,
                        },
                      ]}
                      onPress={() => setOpenCategoryIndex(index === openCategoryIndex ? null : index)}
                    >
                      <Text style={{ color: e.category ? theme.textDark : theme.placeholderText }}>
                        {e.category || i18n.t("selectCategory")}
                      </Text>
                      <Ionicons
                        name={openCategoryIndex === index ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>

                    {openCategoryIndex === index && (
                      <View style={styles.categoryGrid}>
                        {categories
                          .filter((c) => ["Need", "Must", "Want"].includes(c.type))
                          .map((cat, i) => (
                            <TouchableOpacity
                              key={i}
                              style={[
                                styles.categoryItem,
                                {
                                  borderColor: e.category === cat.name ? theme.primary : theme.border,
                                  backgroundColor:
                                    e.category === cat.name ? theme.primary + "20" : theme.white,
                                },
                              ]}
                              onPress={() => {
                                updateExpense(index, "category", cat.name);
                                setOpenCategoryIndex(null);
                              }}
                            >
                              <View
                                style={[
                                  styles.categoryColor,
                                  { backgroundColor: cat.color || "#ccc" },
                                ]}
                              />
                              <Text style={{ fontSize: 12, color: theme.textDark }} numberOfLines={1}>
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}

                    <TextInput
                      style={[
                        styles.amountInput,
                        { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textDark },
                      ]}
                      placeholder={i18n.t("amount") || "Amount"}
                      placeholderTextColor={theme.placeholderText}
                      keyboardType="numeric"
                      value={e.amount}
                      onChangeText={(text) => updateExpense(index, "amount", text)}
                    />

                    <TouchableOpacity
                      style={[styles.addExpenseBtn, { borderColor: theme.border }]}
                      onPress={() => deleteExpense(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.error} />
                      <Text style={{ color: theme.textDark }}>
                        {i18n.t("removeExpense") || "Remove Expense"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addExpenseBtn, { borderColor: theme.border }]}
                  onPress={addExpense}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <Text style={{ color: theme.textDark }}>{i18n.t("addExpense") || "Add Expense"}</Text>
                </TouchableOpacity>

                <Text style={[styles.totalText, { color: theme.textDark }]}>
                  {i18n.t("total") || "Total"}: LKR {calculateTotal().toLocaleString()}
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.error }]}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.buttonText}>{i18n.t("cancel") || "Cancel"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>{i18n.t("save") || "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },


  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 22, fontWeight: "700" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyText: { fontSize: 16, marginTop: 10 },

  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  planExpense: { fontSize: 13 },
  planTotal: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  cardActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "85%",
    paddingBottom: 30,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },

  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },

  expenseCart: { borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 20 },
  expenseNameInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 5, fontSize: 14 },
  amountInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginTop: 10 },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
    justifyContent: "space-between",
  },
  categoryItem: {
    width: "30%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  categoryColor: { width: 16, height: 16, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: "#ccc" },

  addExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 8,
  },

  totalText: { fontSize: 16, fontWeight: "700", textAlign: "right", marginVertical: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
