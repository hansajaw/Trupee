import React, { useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";                
import { useTheme } from "../context/theme-context";
import { useCategories } from "../context/categories-context";
import i18n from "../i18n";

export default function PlannedPayments() {
  const router = useRouter();                           
  const { theme } = useTheme();
  const { categories } = useCategories();

  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState(i18n.t("expense"));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState(i18n.t("monthly"));
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const repeatOptions = [i18n.t("weekly"), i18n.t("monthly"), i18n.t("yearly")];

  const resetForm = () => {
    setType(i18n.t("expense"));
    setTitle("");
    setCategory("");
    setAmount("");
    setFrequency(i18n.t("monthly"));
    setStartDate(new Date());
    setEditIndex(null);
    setCategoryDropdownOpen(false);
  };

  const handleSave = () => {
    if (!title || !category || !amount) {
      Alert.alert(i18n.t("error"), i18n.t("fillRequiredFields"));
      return;
    }

    const newPayment = {
      type,
      title,
      category,
      amount: parseFloat(amount),
      frequency,
      startDate,
    };

    if (editIndex !== null) {
      const updated = [...payments];
      updated[editIndex] = newPayment;
      setPayments(updated);
    } else {
      setPayments([...payments, newPayment]);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (index) => {
    const p = payments[index];
    setType(p.type);
    setTitle(p.title);
    setCategory(p.category);
    setAmount(p.amount.toString());
    setFrequency(p.frequency);
    setStartDate(new Date(p.startDate));
    setEditIndex(index);
    setShowModal(true);
  };

  const handleDelete = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
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
          {i18n.t("plannedPayments")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {i18n.t("noPlannedPayments")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: theme.white }]}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textDark }]}>
                  {item.title} ({item.type})
                </Text>
                <Text style={{ color: theme.textSecondary }}>
                  {item.category} - LKR {item.amount.toLocaleString()}
                </Text>
                <Text style={{ color: theme.textSecondary }}>
                  {item.frequency} • {new Date(item.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
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
      >
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
              <ScrollView>
                <Text style={[styles.modalTitle, { color: theme.textDark }]}>
                  {editIndex !== null
                    ? i18n.t("editPlannedPayment")
                    : i18n.t("addPlannedPayment")}
                </Text>

                <View style={styles.typeRow}>
                  {[i18n.t("income"), i18n.t("expense")].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeButton,
                        { backgroundColor: type === t ? theme.primary : theme.inputBackground },
                      ]}
                      onPress={() => {
                        setType(t);
                        setCategory("");
                      }}
                    >
                      <Text style={{ color: type === t ? theme.white : theme.textDark }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                      color: theme.textDark,
                    },
                  ]}
                  placeholder={i18n.t("paymentTitle")}
                  placeholderTextColor={theme.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />

                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                  onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <Text style={{ color: category ? theme.textDark : theme.placeholderText }}>
                    {category || i18n.t("selectCategory")}
                  </Text>
                  <Ionicons
                    name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {categoryDropdownOpen && (
                  <View style={styles.categoryGrid}>
                    {categories.map((cat, i) => (
                      <TouchableOpacity
                        key={`cat-${i}`}
                        style={[
                          styles.categoryItem,
                          {
                            borderColor: category === cat.name ? theme.primary : theme.border,
                            backgroundColor:
                              category === cat.name ? theme.primary + "20" : theme.white,
                          },
                        ]}
                        onPress={() => {
                          setCategory(cat.name);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <View
                          style={[styles.categoryColor, { backgroundColor: cat.color || "#ccc" }]}
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
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                      color: theme.textDark,
                    },
                  ]}
                  placeholder={i18n.t("amount")}
                  placeholderTextColor={theme.placeholderText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                  onPress={() => {
                    const currentIndex = repeatOptions.indexOf(frequency);
                    const nextIndex = (currentIndex + 1) % repeatOptions.length;
                    setFrequency(repeatOptions[nextIndex]);
                  }}
                >
                  <Text style={{ color: theme.textDark }}>
                    {i18n.t("repeat")}: {frequency}
                  </Text>
                  <Ionicons name="repeat-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: theme.textDark }}>
                    {i18n.t("startDate")}: {startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setStartDate(date);
                    }}
                  />
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.error }]}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.buttonText}>{i18n.t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>{i18n.t("save")}</Text>
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
    marginBottom: 10,
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

  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },

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
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },

  typeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  typeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },

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
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
