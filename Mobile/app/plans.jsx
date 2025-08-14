import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useRouter } from "expo-router";
import i18n from "../i18n";

export default function Plans() {
  const { theme } = useTheme();
  const router = useRouter();

  const buttons = [
    {
      title: i18n.t("plannedPayments"),
      subtitle: i18n.t("plannedPaymentsDesc"),
      icon: "calendar-outline",
      onPress: () => router.push("/plannedPayment"),
    },
    {
      title: i18n.t("budgetPlans"),
      subtitle: i18n.t("budgetPlansDesc"),
      icon: "wallet-outline",
      onPress: () => router.push("/budgetPlan"),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.textDark }]}>{i18n.t("plans")}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {i18n.t("plansSubtitle")}
      </Text>

      <View style={{ marginTop: 20, gap: 16 }}>
        {buttons.map((btn, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}
            activeOpacity={0.85}
            onPress={btn.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Ionicons name={btn.icon} size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.textDark }]}>{btn.title}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{btn.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
});