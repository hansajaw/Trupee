import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Privacy Policy</Text>

      <Text style={styles.paragraph}>
        Trupee is committed to protecting your privacy. This policy explains how we collect, use, and share your personal information.
      </Text>

      <Text style={styles.sectionTitle}>1. Information We Collect</Text>
      <Text style={styles.paragraph}>
        We may collect personal information such as your name, email, device ID, location, and usage data.
      </Text>

      <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
      <Text style={styles.paragraph}>
        We use your information to provide and improve our services, respond to your queries, and personalize your experience.
      </Text>

      <Text style={styles.sectionTitle}>3. Data Security</Text>
      <Text style={styles.paragraph}>
        We implement strict security measures to protect your data from unauthorized access or disclosure.
      </Text>

      <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
      <Text style={styles.paragraph}>
        We may share data with third-party services such as analytics and authentication providers, but only as necessary.
      </Text>

      <Text style={styles.sectionTitle}>5. Your Rights</Text>
      <Text style={styles.paragraph}>
        You can request access, correction, or deletion of your data at any time by contacting us.
      </Text>

      <Text style={styles.paragraph}>
        If you have questions, contact us at: support@trupee.app
      </Text>

      <Text style={styles.paragraph}>
        Last updated: August 14, 2025
      </Text>
    </ScrollView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  paragraph: { fontSize: 16, lineHeight: 24, marginTop: 8, color: '#333' },
});
