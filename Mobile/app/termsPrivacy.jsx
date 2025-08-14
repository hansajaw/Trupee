import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useRouter } from "expo-router";
import i18n from "../i18n";

export default function TermsPrivacy() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.white, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textDark }]}>
          {i18n.t("termsPrivacy")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.textDark }]}>
          {i18n.t("termsOfService")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("termsIntro")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("useOfApp")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("useOfAppDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("userResponsibilities")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("userResponsibilitiesDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("limitationOfLiability")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("limitationOfLiabilityDesc")}
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textDark, marginTop: 24 },
          ]}
        >
          {i18n.t("privacyPolicy")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("privacyIntro")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("infoWeCollect")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("infoWeCollectDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("howWeUseInfo")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("howWeUseInfoDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("dataProtection")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("dataProtectionDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("changesToPolicy")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("changesToPolicyDesc")}
        </Text>

        <Text style={[styles.subTitle, { color: theme.textDark }]}>
          {i18n.t("contactUs")}
        </Text>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          {i18n.t("contactUsDesc")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  subTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  paragraph: { fontSize: 14, marginTop: 4, lineHeight: 20 },
});
