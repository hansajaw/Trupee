import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/theme-context";

export default function Verified() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();


  useFocusEffect(
    useCallback(() => {

      const tabs =
        navigation.getParent?.("main-tabs") ??
        navigation.getParent?.()?.getParent?.(); 

      tabs?.setOptions({ tabBarStyle: { display: "none" } });
      return () => tabs?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  return (
    <View style={[styles.c, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textDark }]}>Email verified ✅</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>You can now log in.</Text>

      <TouchableOpacity
        onPress={() => router.replace("/login")}  
        style={[styles.btn, { backgroundColor: theme.primary }]}
        activeOpacity={0.9}
      >
        <Text style={styles.btnText}>Go to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { marginTop: 8, fontSize: 14 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginTop: 16 },
  btnText: { color: "#fff", fontWeight: "700" },
});
