import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/theme-context";

export default function VerifyEmail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const email = route.params?.email || "";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons name="mail-open-outline" size={64} color={theme.primary} />
      <Text style={[styles.title, { color: theme.textDark }]}>Check your inbox</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        We sent a verification link to{'\n'}
        <Text style={{ color: theme.textDark, fontWeight: "700" }}>{email}</Text>
      </Text>

      <TouchableOpacity
        onPress={() => navigation.replace("login")}
        style={[styles.btn, { backgroundColor: theme.primary }]}
        activeOpacity={0.9}
      >
        <Text style={styles.btnText}>Back to Login</Text>
      </TouchableOpacity>

      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Didn’t get the email? Check spam, or try again from the login screen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  btn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { fontSize: 12, textAlign: "center", marginTop: 10 },
});
