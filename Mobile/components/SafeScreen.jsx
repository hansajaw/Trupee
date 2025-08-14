import React from "react";
import { SafeAreaView, View } from "react-native";
import { useTheme } from "../context/theme-context";

export default function SafeScreen({ children }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
