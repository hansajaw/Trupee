import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/theme-context";
import { useUser } from "../../context/user-context";
import { useRouter } from "expo-router";

import { API_URL } from "../../constants/api";

const { height } = Dimensions.get("window");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { setAuth } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseJSON = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text };
    }
  };

  const onLogin = async () => {
    if (!EMAIL_RE.test(email.trim()) || !password) {
      Alert.alert(
        "Check your details",
        "• Valid email address\n• Password is required"
      );
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data?.message || "Login failed");

      await setAuth(data.token, data.user);
      navigation.replace("homePage");
    } catch (e) {
      Alert.alert("Login Failed", e?.message || "Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCenter} pointerEvents="none">
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.headerText, { color: theme.textSecondary }]}>
            Don’t have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("signup")} style={styles.headerLinkBtn}>
            <Text style={[styles.headerLink, { color: theme.primary }]}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.bottom}>
        <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={[styles.title, { color: theme.textDark }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to your account</Text>

            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: theme.textDark }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: theme.textDark }]}
                  placeholder="Your password"
                  placeholderTextColor={theme.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eye} hitSlop={8}>
                  <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("forgotPasswordScreen")} style={{ alignSelf: "center", marginBottom: 12 }}>
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: "600" }}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLogin}
              disabled={loading}
              style={[styles.cta, { backgroundColor: loading ? theme.textSecondary : theme.primary }]}
              activeOpacity={0.9}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                          <Text style={[styles.terms, { color: theme.textSecondary }]}>
                            By signing up, you agree to our
                          </Text>
            
                          <TouchableOpacity onPress={() => router.push('/termsOfServiceScreen')}>
                            <Text style={[styles.termsLink, { color: theme.primary }]}> Terms of Service</Text>
                          </TouchableOpacity>
            
                          <Text style={[styles.terms, { color: theme.textSecondary }]}> and </Text>
            
                          <TouchableOpacity onPress={() => router.push('/privacyPolicyScreen')}>
                            <Text style={[styles.termsLink, { color: theme.primary }]}>Privacy Policy</Text>
                          </TouchableOpacity>
            
                          <Text style={[styles.terms, { color: theme.textSecondary }]}>.</Text>
                        </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 36,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: { width: 460, height: 352, opacity: 0.95, marginTop: 400 },

  headerRight: { flexDirection: "row", alignItems: "center" },
  headerText: { fontSize: 14, marginRight: 6 },
  headerLinkBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  headerLink: { fontSize: 14, fontWeight: "700" },

  bottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 14, paddingBottom: 12 },

  card: { borderRadius: 18, padding: 18, borderWidth: 1, maxHeight: height * 0.72 },

  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 14 },

  group: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 6, marginLeft: 4 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  eye: { padding: 6 },

  cta: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4, marginBottom: 12 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  termsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: 10,
  paddingHorizontal: 16,
},

termsText: {
  fontSize: 13,
  lineHeight: 20,
  textAlign: 'center',
},

termsLink: {
  fontSize: 13,
  fontWeight: '600',
  textAlign: 'center',
  textDecorationLine: 'underline',
  marginHorizontal: 2,
},

});
