import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useCategories } from "../context/categories-context";
import i18n from "../i18n";

const GROUPS = ["Income", "Expense", "Loan"]; 

export default function Categories() {
  const { theme } = useTheme();
  const {
    categories,
    addCategory,
    deleteCategory,
    getByGroup,
    getExpenseByPriority,
  } = useCategories();

  const [activeGroup, setActiveGroup] = useState("Expense");
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("#22C55E");
  const [selectedType, setSelectedType] = useState("Need"); 

  const addCategoryColors = [
    "#22C55E", "#10B981", "#34D399", "#3B82F6", "#8B5CF6",
    "#F59E0B", "#EF4444", "#A78BFA", "#F472B6", "#60A5FA", "#64748B"
  ];

  const expenseTypes = ["Need", "Must", "Want"];

  const sections = useMemo(() => {
    if (activeGroup !== "Expense") return [];
    return [
      { title: i18n.t("need") || "Need", data: getExpenseByPriority("Need") },
      { title: i18n.t("must") || "Must", data: getExpenseByPriority("Must") },
      { title: i18n.t("want") || "Want", data: getExpenseByPriority("Want") },
    ];
  }, [activeGroup, categories]);

  const simpleListData = useMemo(() => {
    if (activeGroup === "Expense") return [];
    return getByGroup(activeGroup);
  }, [activeGroup, categories]);

  const onAdd = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Alert.alert(
        i18n.t("error") || "Error",
        i18n.t("categoryNameEmpty") || "Category name cannot be empty"
      );
      return;
    }

    const existsHere = getByGroup(activeGroup).some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existsHere) {
      Alert.alert(
        i18n.t("error") || "Error",
        i18n.t("categoryExists") || "Category already exists in this group"
      );
      return;
    }

    addCategory({
      name: trimmed,
      color: selectedColor,
      group: activeGroup,
      ...(activeGroup === "Expense" ? { type: selectedType } : {}),
    });

    setNewCategory("");
    setSelectedColor("#22C55E");
    setSelectedType("Need");
    setShowModal(false);
  };

  const onDelete = (item) => {
    Alert.alert(
      i18n.t("deleteCategory") || "Delete Category",
      `${i18n.t("delete") || "Delete"} "${String(item.name)}"?`,
      [
        { text: i18n.t("cancel") || "Cancel", style: "cancel" },
        {
          text: i18n.t("delete") || "Delete",
          style: "destructive",
          onPress: () => deleteCategory(item.name, item.group || activeGroup),
        },
      ]
    );
  };

  const renderCategoryRow = ({ item }) => (
    <View style={[styles.categoryItem, { backgroundColor: theme.white, borderColor: theme.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={{ color: theme.textDark, fontSize: 16 }}>{String(item.name || "")}</Text>
        {activeGroup === "Expense" && item.type ? (
          <Text style={{ marginLeft: 8, fontSize: 12, color: theme.textSecondary }}>({item.type})</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(item)}>
        <Ionicons name="trash-outline" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  const ListEmpty = (
    <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 24 }}>
      {i18n.t("noCategories") || "No categories yet"}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={[styles.tabs, { backgroundColor: theme.backgroundSecondary }]}>
        {GROUPS.map((g) => {
          const active = activeGroup === g;
          return (
            <TouchableOpacity
              key={g}
              style={[
                styles.tabBtn,
                { backgroundColor: active ? theme.primary : "transparent", borderColor: theme.border },
              ]}
              onPress={() => setActiveGroup(g)}
            >
              <Text style={{ color: active ? theme.white : theme.textDark, fontWeight: "600" }}>
                {g === "Expense"
                  ? (i18n.t("expenses") || "Expenses")
                  : g === "Income"
                  ? (i18n.t("income") || "Income")
                  : (i18n.t("loan") || "Loan")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeGroup === "Expense" ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.group || "Expense"}-${String(item.name)}-${index}`}
          renderItem={renderCategoryRow}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{String(title || "")}</Text>
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={ListEmpty}
        />
      ) : (
        <FlatList
          data={simpleListData}
          keyExtractor={(item, index) => `${item.group || "Unknown"}-${String(item.name)}-${index}`}
          renderItem={renderCategoryRow}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={ListEmpty}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.white, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textDark }]}>
              {(i18n.t("addCategory") || "Add Category") + ` • ${activeGroup}`}
            </Text>

            <TextInput
              style={[
                styles.input,
                { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.textDark },
              ]}
              placeholder={i18n.t("enterCategoryName") || "Enter category name"}
              placeholderTextColor={theme.placeholderText}
              value={newCategory}
              onChangeText={setNewCategory}
            />

            <Text style={{ marginBottom: 8, color: theme.textDark }}>
              {i18n.t("chooseColor") || "Choose color"}
            </Text>
            <View style={styles.colorRow}>
              {addCategoryColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 1,
                      borderColor: selectedColor === color ? theme.white : theme.border,
                      elevation: selectedColor === color ? 2 : 0,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            {activeGroup === "Expense" && (
              <>
                <Text style={{ marginTop: 12, marginBottom: 8, color: theme.textDark }}>
                  {i18n.t("categoryType") || "Category Type"}
                </Text>
                <View style={styles.typeRow}>
                  {expenseTypes.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeButton,
                        { backgroundColor: selectedType === t ? theme.primary : theme.inputBackground },
                      ]}
                      onPress={() => setSelectedType(t)}
                    >
                      <Text style={{ color: selectedType === t ? theme.white : theme.textDark }}>
                        {i18n.t(t.toLowerCase()) || t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.error }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>{i18n.t("cancel") || "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onAdd}
              >
                <Text style={styles.buttonText}>{i18n.t("add") || "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 10 },

  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 10 },

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

  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalContent: { width: "100%", borderRadius: 12, padding: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },

  colorRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 8 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },

  typeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  typeButton: { flex: 1, marginHorizontal: 4, paddingVertical: 10, borderRadius: 8, alignItems: "center" },

  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
