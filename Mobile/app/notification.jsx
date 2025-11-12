import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Switch,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useTheme } from "../context/theme-context";
import { useNotifications } from "../context/notification-context";
import i18n from "../i18n";

export default function NotificationScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    isEnabled,
    planned,
    addPlanned,
    updatePlanned,
    removePlanned,
    toggleItem,
  } = useNotifications();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [remindBeforeDays, setRemindBeforeDays] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setAmount("");
    setDueDate(new Date());
    setRemindBeforeDays(1);
    setEnabled(true);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setTitle(item.title || "");
    setAmount(String(item.amount ?? ""));
    setDueDate(new Date(item.dueDate));
    setRemindBeforeDays(item.remindBeforeDays ?? 1);
    setEnabled(!!item.enabled);
    setShowModal(true);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert(
        i18n.t("titleRequired") || "Title required",
        i18n.t("enterTitle") || "Please enter a title."
      );
      return;
    }
    const payload = {
      title: title.trim(),
      amount: Number(amount) || 0,
      dueDate: dueDate.toISOString(),
      remindBeforeDays: Number(remindBeforeDays) || 1,
      enabled,
    };
    if (editing) {
      await updatePlanned(editing.id, payload);
    } else {
      await addPlanned(payload);
    }
    setShowModal(false);
    resetForm();
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.item,
        { backgroundColor: theme.white, borderColor: theme.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.textDark }]}>
          {item.title || "Payment"}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
          LKR {(Number(item.amount) || 0).toLocaleString()} •{" "}
          {new Date(item.dueDate).toLocaleDateString()}
          {item.remindBeforeDays
            ? ` • ${item.remindBeforeDays}d ${i18n.t("before") || "before"}`
            : ""}
        </Text>
      </View>

      <Switch
        value={!!item.enabled}
        onValueChange={(v) => toggleItem(item.id, v)}
        disabled={!isEnabled}
        trackColor={{ false: theme.border, true: theme.primaryLight }}
        thumbColor={item.enabled ? theme.primary : theme.white}
        style={{ marginRight: 8, opacity: isEnabled ? 1 : 0.4 }}
      />

      <TouchableOpacity
        onPress={() => openEdit(item)}
        style={{ paddingHorizontal: 6 }}
      >
        <Ionicons name="create-outline" size={20} color={theme.textDark} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => removePlanned(item.id)}
        style={{ paddingHorizontal: 6 }}
      >
        <Ionicons name="trash-outline" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={[
            styles.iconBtn,
            { backgroundColor: theme.white, borderColor: theme.border },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textDark} />
        </TouchableOpacity>

        <Text style={[styles.h1, { color: theme.textDark }]}>
          {i18n.t("notifications") || "Notifications"}
        </Text>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: (isEnabled ? theme.primary : theme.error) + "22",
              borderColor: isEnabled ? theme.primary : theme.error,
            },
          ]}
        >
          <Ionicons
            name={
              isEnabled
                ? "checkmark-circle-outline"
                : "close-circle-outline"
            }
            size={14}
            color={isEnabled ? theme.primary : theme.error}
          />
          <Text
            style={{
              color: isEnabled ? theme.primary : theme.error,
              marginLeft: 6,
              fontWeight: "600",
              fontSize: 12,
            }}
          >
            {isEnabled
              ? i18n.t("enabled") || "Enabled"
              : i18n.t("disabled") || "Disabled"}
          </Text>
        </View>
      </View>

      {!isEnabled && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.primary + "20",
              borderColor: theme.primary,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={theme.primary}
          />
          <Text style={{ color: theme.textDark, marginLeft: 6, flex: 1 }}>
            {i18n.t("notifTurnedOff") ||
              "Reminders are turned off in Settings."}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={[styles.bannerBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
              {i18n.t("openSettings") || "Open Settings"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={planned}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.textSecondary}
            />
            <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
              {i18n.t("noPlannedPayments") || "No planned payments yet."}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add reminder"
        activeOpacity={0.9}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.fabText}>Add reminder</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
        >
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.white,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.textDark }]}>
                {editing
                  ? i18n.t("editReminder") || "Edit Reminder"
                  : i18n.t("addReminder") || "Add Reminder"}
              </Text>

              <View style={{ gap: 10 }}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                      color: theme.textDark,
                    },
                  ]}
                  placeholder={i18n.t("title") || "Title"}
                  placeholderTextColor={theme.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />

                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                      color: theme.textDark,
                    },
                  ]}
                  placeholder={i18n.t("amount") || "Amount (LKR)"}
                  placeholderTextColor={theme.placeholderText}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.rowBetween,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={{ color: theme.textDark }}>
                    {(i18n.t("dueDate") || "Due date")}:{" "}
                    {dueDate.toLocaleDateString()}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>

                {showPicker && (
                  <>
                    {Platform.OS === "ios" ? (
                      <Modal
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowPicker(false)}
                      >
                        <View style={styles.pickerSheet}>
                          <View
                            style={[
                              styles.pickerInner,
                              { backgroundColor: theme.white },
                            ]}
                          >
                            <DateTimePicker
                              value={dueDate}
                              mode="date"
                              display="spinner"
                              onChange={(_, d) => d && setDueDate(d)}
                              style={{ alignSelf: "stretch" }}
                            />
                            <TouchableOpacity
                              style={[
                                styles.doneBtn,
                                { backgroundColor: theme.primary },
                              ]}
                              onPress={() => setShowPicker(false)}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontWeight: "600",
                                }}
                              >
                                {i18n.t("done") || "Done"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Modal>
                    ) : (
                      <DateTimePicker
                        value={dueDate}
                        mode="date"
                        display="default"
                        onChange={(e, d) => {
                          setShowPicker(false);
                          if (d) setDueDate(d);
                        }}
                      />
                    )}
                  </>
                )}

                <View
                  style={[
                    styles.input,
                    styles.rowBetween,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                >
                  <Text style={{ color: theme.textDark }}>
                    {(i18n.t("remindBefore") || "Remind before")}:{" "}
                    {remindBeforeDays} {i18n.t("days") || "days"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() =>
                        setRemindBeforeDays(
                          Math.max(0, (Number(remindBeforeDays) || 1) - 1)
                        )
                      }
                      style={[styles.stepBtn, { borderColor: theme.border }]}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={theme.textDark}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setRemindBeforeDays(
                          (Number(remindBeforeDays) || 1) + 1
                        )
                      }
                      style={[styles.stepBtn, { borderColor: theme.border }]}
                    >
                      <Ionicons name="add" size={16} color={theme.textDark} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.input,
                    styles.rowBetween,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}
                >
                  <Text style={{ color: theme.textDark }}>
                    {i18n.t("enabled") || "Enabled"}
                  </Text>
                  <Switch
                    value={enabled}
                    onValueChange={setEnabled}
                    trackColor={{
                      false: theme.border,
                      true: theme.primaryLight,
                    }}
                    thumbColor={enabled ? theme.primary : theme.white}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.error }]}
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.buttonText}>
                    {i18n.t("cancel") || "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={save}
                >
                  <Text style={styles.buttonText}>
                    {i18n.t("save") || "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { fontSize: 22, fontWeight: "700" },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  item: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "600" },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: { elevation: 6 },
    }),
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalScroll: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    maxHeight: "88%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  input: { borderWidth: 1, borderRadius: 10, padding: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  pickerSheet: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  pickerInner: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  doneBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
