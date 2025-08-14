import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useRouter } from "expo-router";
import { useUser } from "../context/user-context";
import i18n from "../i18n";

export default function EditProfile() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateUser } = useUser();

  const [initial, setInitial] = useState(user || {});

  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [username, setUsername] = useState(
    user?.userName || user?.username || user?.fullName || ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInitial(user || {});
    setAvatar(user?.avatar || "");
    setUsername(user?.userName || user?.username || user?.fullName || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setBio(user?.bio || "");
  }, [user]);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const usernameValid = username.trim().length >= 2;

  const dirty =
    avatar !== (initial?.avatar || "") ||
    username !== (initial?.userName || initial?.username || initial?.fullName || "") ||
    email !== (initial?.email || "") ||
    phone !== (initial?.phone || "") ||
    bio !== (initial?.bio || "");

  const canSave = dirty && emailValid && usernameValid && !saving;

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) setAvatar(res.assets[0].uri);
    } catch {
      Alert.alert(i18n.t("error") || "Error", i18n.t("imagePickerError") || "Could not open gallery.");
    }
  };

  const removeImage = () => {
    Alert.alert(
      i18n.t("removePhoto") || "Remove photo",
      i18n.t("removePhotoConfirm") || "This will clear your profile picture.",
      [
        { text: i18n.t("cancel") || "Cancel", style: "cancel" },
        { text: i18n.t("remove") || "Remove", style: "destructive", onPress: () => setAvatar("") },
      ]
    );
  };

  const resetChanges = () => {
    setAvatar(initial?.avatar || "");
    setUsername(initial?.userName || initial?.username || initial?.fullName || "");
    setEmail(initial?.email || "");
    setPhone(initial?.phone || "");
    setBio(initial?.bio || "");
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await updateUser({
        avatar,
        userName: username,
        username,
        email,
        phone,
        bio,
      });
      Alert.alert(i18n.t("saved") || "Saved", i18n.t("profileUpdated") || "Your profile has been updated.");
      router.back();
    } catch {
      Alert.alert(i18n.t("error") || "Error", i18n.t("saveFailed") || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.white, borderColor: theme.border }]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textDark} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: theme.textDark }]}>
              {i18n.t("editProfile") || "Edit Profile"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: theme.inputBackground }]}>
                    <Ionicons name="person" size={36} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {i18n.t("profilePhoto") || "Profile Photo"}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button title={i18n.t("changePhoto") || "Change"} onPress={pickImage} theme={theme} />
                  <Button title={i18n.t("remove") || "Remove"} onPress={removeImage} theme={theme} variant="outline" />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
            <Input
              label={i18n.t("username") || "Username"}
              value={username}
              onChangeText={setUsername}
              placeholder={i18n.t("usernamePlaceholder") || "Your username"}
              theme={theme}
              error={!usernameValid ? (i18n.t("usernameInvalid") || "Username must be at least 2 characters.") : ""}
            />
            <Input
              label={i18n.t("email") || "Email"}
              value={email}
              onChangeText={setEmail}
              placeholder="you@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              theme={theme}
              error={!emailValid ? (i18n.t("emailInvalid") || "Enter a valid email.") : ""}
            />
            <Input
              label={i18n.t("phone") || "Phone"}
              value={phone}
              onChangeText={setPhone}
              placeholder="+94 7XXXXXXXX"
              keyboardType="phone-pad"
              theme={theme}
            />
            <Input
              label={i18n.t("bio") || "Bio"}
              value={bio}
              onChangeText={setBio}
              placeholder={i18n.t("bioPlaceholder") || "Tell us about yourself"}
              theme={theme}
              multiline
            />
          </View>

          <View style={styles.actionsRow}>
            <Button
              title={i18n.t("discard") || "Discard"}
              onPress={dirty ? resetChanges : undefined}
              theme={theme}
              variant="outline"
              disabled={!dirty}
            />
            <Button
              title={saving ? (i18n.t("saving") || "Saving...") : (i18n.t("saveChanges") || "Save Changes")}
              onPress={canSave ? saveProfile : undefined}
              theme={theme}
              disabled={!canSave}
              primary
            />
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


function Input({ label, theme, error, multiline, style, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.textDark,
            height: multiline ? 110 : 48,
            paddingTop: multiline ? 10 : 0,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {!!error && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}
    </View>
  );
}

function Button({ title, onPress, theme, variant = "solid", primary, disabled, style }) {
  const solid = variant === "solid";
  const bg = disabled ? theme.inputBackground : primary ? theme.primary : theme.white;
  const textColor = disabled ? theme.textSecondary : primary ? theme.white : theme.textDark;
  const borderColor = primary ? theme.primary : theme.border;

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.85}
      style={[
        styles.btn,
        {
          backgroundColor: solid ? bg : "transparent",
          borderColor: variant === "outline" ? borderColor : "transparent",
        },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontWeight: "700" },

  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },

  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },

  label: { fontSize: 12, marginBottom: 8 },

  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 },
  error: { fontSize: 12, marginTop: 6 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  btnText: { fontWeight: "600" },
});
