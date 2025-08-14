import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../context/theme-context";
import { changePasswordRequest } from "../lib/api";
import { useUser } from "../context/user-context"; 
export default function ChangePassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const { token, signOut } = useUser(); 

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields"); return false;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters"); return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match"); return false;
    }
    if (newPassword === oldPassword) {
      Alert.alert("Error", "New password must be different from old password"); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await changePasswordRequest({ oldPassword, newPassword, token });
      Alert.alert("Success", "Password changed. Please sign in again.", [
        { text: "OK", onPress: async () => {
          try { await signOut?.(); } catch {}
          router.replace("/(auth)/login");
        }},
      ]);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textDark }]}>Change Password</Text>
          <View />
        </View>

        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.textDark }]}
            placeholder="Old Password"
            placeholderTextColor={theme.placeholderText}
            secureTextEntry={!showOld}
            value={oldPassword}
            onChangeText={setOldPassword}
            autoCapitalize="none"
            textContentType="password"
          />
          <TouchableOpacity onPress={() => setShowOld(!showOld)}>
            <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.textDark }]}
            placeholder="New Password"
            placeholderTextColor={theme.placeholderText}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.input, { color: theme.textDark }]}
            placeholder="Confirm New Password"
            placeholderTextColor={theme.placeholderText}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 14 },
  saveButton: { paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
