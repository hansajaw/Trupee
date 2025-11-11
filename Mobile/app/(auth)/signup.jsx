import React, { useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";


const { height } = Dimensions.get("window");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const router = useRouter();


  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const valid = useMemo(
    () => userName.trim().length >= 3 && EMAIL_RE.test(email.trim()) && password.length >= 8,
    [userName, email, password]
  );

  const parseJSON = async (res) => {
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return { message: text }; }
  };

  const onSignup = async () => {
    if (!valid) {
      Alert.alert("Check your details", "• Username (min 3)\n• Valid email address\n• Password (min 8)");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data?.message || `Signup failed (${res.status})`);

      Alert.alert(
        "Verify your email",
        `We sent a verification link to ${email.trim()}. Please check your inbox.`,
        [{ text: "OK", onPress: () => navigation.replace("verifyEmail", { email: email.trim() }) }]
      );
    } catch (e) {
      Alert.alert("Error", e?.message || "Internal server error");
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
          <Text style={[styles.headerText, { color: theme.textSecondary }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("login")} style={styles.headerLinkBtn}>
            <Text style={[styles.headerLink, { color: theme.primary }]}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.bottom}>
        <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={[styles.title, { color: theme.textDark }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join us and get started today!</Text>

            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
              <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: theme.textDark }]}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.placeholderText}
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                />
              </View>
            </View>

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
                  placeholder="Create a password (min 8)"
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


            <TouchableOpacity
              onPress={onSignup}
              disabled={loading || !valid}
              style={[
                styles.cta,
                {
                  backgroundColor: !valid ? theme.textSecondary : theme.primary,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              activeOpacity={0.9}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign Up</Text>}
            </TouchableOpacity>
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
  headerLogo: { width: 460, height: 352, opacity: 0.95, marginTop: 350 },
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
