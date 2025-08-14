// app/_layout.jsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { ThemeProvider, useTheme } from "../context/theme-context";
import { CategoriesProvider } from "../context/categories-context";
import { PaymentsProvider } from "../context/payment-context";
import { TransactionsProvider } from "../context/transactions-context";
import { NotificationProvider } from "../context/notification-context";
import { UserProvider } from "../context/user-context";
import { AuthProvider } from "../context/auth-context";
import i18n from "../i18n";

export default function RootLayoutWrapper() {
  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider>
          <CategoriesProvider>
            <PaymentsProvider>
              <TransactionsProvider>
                <NotificationProvider>
                  <RootLayout />
                </NotificationProvider>
              </TransactionsProvider>
            </PaymentsProvider>
          </CategoriesProvider>
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
}

function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useTheme();

  const normalizePath = (p) => {
    const noQuery = (p || "").split("#")[0].split("?")[0];
    return noQuery.replace(/\/?\([^/)]*\)\//g, "/").replace(/\/+/g, "/");
  };

  const current = normalizePath(pathname);

  const tabs = [
    { icon: "home", label: i18n.t("home"), route: "/homePage" },
    { icon: "wallet-outline", label: i18n.t("plans"), route: "/plans" },
    { icon: "stats-chart-outline", label: i18n.t("statistics"), route: "/statics" },
    { icon: "settings-outline", label: i18n.t("settings"), route: "/settings" },
  ];

  const AUTH_ROUTES = new Set(["/login", "/signup"]);
  const HIDE_ROUTES = new Set([
    "/add",
    "/changePassword",
    "/editProfile",
    "/verifyEmail",
    "/verified",
    "/categories",
    "/forgotPasswordScreen",
    "/termsOfServiceScreen",
    "/privacyPolicyScreen",
    "/notification",
    "/budgetPlan",
    "/plannedPayment",
    "financialReport",
    "/termsPrivacy"
  ]);

  const isInSet = (set, path) =>
    Array.from(set).some((base) => path === base || path.startsWith(base + "/"));

  const showBottomNav = !(isInSet(AUTH_ROUTES, current) || isInSet(HIDE_ROUTES, current));

  const isActive = (route) =>
    current === route || current.startsWith(route + "/");

  return (
    <SafeScreen>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="plans" />
          <Stack.Screen name="statics" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notification" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="add"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="changePassword"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="editProfile" />
        </Stack>

        {showBottomNav && (
          <View
            style={[
              styles.bottomNav,
              { backgroundColor: theme.white, borderTopColor: theme.border },
            ]}
          >
            {tabs.map((item) => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.navItem}
                  onPress={() => !active && router.push(item.route)}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={active ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.navText,
                      { color: active ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
