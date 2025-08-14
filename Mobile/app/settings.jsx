// app/settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../context/theme-context";
import { useNotifications } from "../context/notification-context";
import { useUser } from "../context/user-context";
import i18n, { setAppLanguage } from "../i18n";

const LANG_KEY = "APP_LANG";

const firstNonEmpty = (...vals) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() || "";

const getDisplayName = (user) => {
  if (!user) return "";
  const joined = firstNonEmpty(
    user.userName,
    user.username,
    user.name,
    user.fullName,         
    user.displayName,
    [user.firstName, user.lastName].filter(Boolean).join(" "),
    user.profile?.name
  );
  return joined || "";
};

const getPhotoUri = (user) => {
  if (!user) return "";
  const candidates = [
    user.profileImage,
    user.avatar,
    user.photoURL,
    user.photoUri,
    user.profile?.photoURL,
    user.profile?.avatar,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (c && typeof c === "object" && typeof c.uri === "string" && c.uri.trim()) {
      return c.uri.trim();
    }
  }
  return "";
};

export default function Settings() {
  const router = useRouter();
  const { isDark, setIsDark, theme } = useTheme();
  const { isEnabled: notificationsEnabled, setIsEnabled: setNotificationsEnabled } = useNotifications();
  const { user } = useUser();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.locale);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && saved !== selectedLanguage) {
          i18n.locale = saved;
          setSelectedLanguage(saved);
        }
      } catch {}
    })();
  }, []);

  const handleLanguageChange = async (lang) => {
    await setAppLanguage(lang);
    setSelectedLanguage(lang);
    try { await AsyncStorage.setItem(LANG_KEY, lang); } catch {}
  };

  const handleLogout = () => {
    Alert.alert(i18n.t("logout"), i18n.t("logoutConfirm"), [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("logout"),
        style: "destructive",
        onPress: async () => {
          try { router.replace("/(auth)/login"); }
          catch { router.replace("/"); }
        },
      },
    ]);
  };

  const profileName = useMemo(() => getDisplayName(user) || "User", [user]);
  const profileEmail = useMemo(
    () => firstNonEmpty(user?.email, user?.profile?.email) || "user@example.com",
    [user]
  );
  const photoUri = useMemo(() => getPhotoUri(user), [user]);

  const [imgKey, setImgKey] = useState(0);
  useEffect(() => {
    setImgKey((k) => k + 1);
  }, [photoUri]);

  const normalizedUri = useMemo(() => {
    if (!photoUri) return "";
    if (
      photoUri.startsWith("file://") ||
      photoUri.startsWith("content://") ||
      photoUri.startsWith("http://") ||
      photoUri.startsWith("https://")
    ) {
      return photoUri;
    }

    return `file://${photoUri}`;
  }, [photoUri]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: theme.textDark }]}>{i18n.t("settings")}</Text>

      <View style={styles.profileSection}>
       <View style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 2, borderColor: theme.primary, alignSelf: "center" }}>
          {user?.avatar ? (
            <Image
              key={user.avatar}       
              source={{ uri: user.avatar }} 
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onError={() => {}}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.inputBackground }}>
              <Ionicons name="person" size={40} color={theme.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.textDark }]} numberOfLines={1}>
            {profileName}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>
            {profileEmail}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.editProfileBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/editProfile")}
        >
          <Text style={{ color: theme.white, fontWeight: "600" }}>{i18n.t("editProfile")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{i18n.t("preferences")}</Text>
      <View style={[styles.card, { backgroundColor: theme.white }]}>
        <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
          <View style={styles.optionLeft}>
            <Ionicons name="notifications-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("notifications")}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={notificationsEnabled ? theme.primary : theme.white}
          />
        </View>

        <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
          <View style={styles.optionLeft}>
            <Ionicons name="language-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("language")}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                { backgroundColor: selectedLanguage === "en" ? theme.primary : theme.inputBackground },
              ]}
              onPress={() => handleLanguageChange("en")}
            >
              <Text style={{ color: selectedLanguage === "en" ? theme.white : theme.textDark }}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                { backgroundColor: selectedLanguage === "si" ? theme.primary : theme.inputBackground },
              ]}
              onPress={() => handleLanguageChange("si")}
            >
              <Text style={{ color: selectedLanguage === "si" ? theme.white : theme.textDark }}>සිංහල</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.optionRow, { borderBottomColor: theme.border }]}>
          <View style={styles.optionLeft}>
            <Ionicons name="moon-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("darkMode")}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setIsDark}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={isDark ? theme.primary : theme.white}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{i18n.t("account")}</Text>
      <View style={[styles.card, { backgroundColor: theme.white }]}>
        <TouchableOpacity
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/changePassword")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("password")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/categories")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="grid-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("categories")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/termsPrivacy")}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="document-text-outline" size={22} color={theme.textDark} />
            <Text style={[styles.optionText, { color: theme.textDark }]}>{i18n.t("termsPrivacy")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, { borderBottomColor: theme.border }]}
          onPress={handleLogout}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
            <Text style={[styles.optionText, { color: theme.error }]}>{i18n.t("logout")}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  profileSection: { alignItems: "center", marginBottom: 20 },

  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 10,
  },

  profileImage: { width: "100%", height: "100%" },

  profileInfo: { alignItems: "center", maxWidth: "70%" },
  profileName: { fontSize: 18, fontWeight: "600" },
  profileEmail: { fontSize: 14, marginBottom: 10 },
  editProfileBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },

  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  card: { borderRadius: 12, paddingVertical: 8, marginBottom: 16 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { fontSize: 15 },
  languageButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginLeft: 8 },
});
