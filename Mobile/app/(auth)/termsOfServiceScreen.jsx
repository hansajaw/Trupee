import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

const TermsOfServiceScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Terms of Service</Text>
      <Text style={styles.paragraph}>
        Welcome to Trupee. By accessing or using the Trupee app, you agree to be bound by these Terms of Service.
      </Text>

      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.paragraph}>
        You must accept all the terms in this agreement to use the app. If you do not agree, you may not use the service.
      </Text>

      <Text style={styles.sectionTitle}>2. Use of the Service</Text>
      <Text style={styles.paragraph}>
        You agree to use the app only for lawful purposes and in a way that does not infringe the rights of others.
      </Text>

      <Text style={styles.sectionTitle}>3. Account Responsibility</Text>
      <Text style={styles.paragraph}>
        You are responsible for maintaining the confidentiality of your account and password and for all activities under your account.
      </Text>

      <Text style={styles.sectionTitle}>4. Termination</Text>
      <Text style={styles.paragraph}>
        We may suspend or terminate your access if you violate these terms or abuse the service.
      </Text>

      <Text style={styles.sectionTitle}>5. Changes to Terms</Text>
      <Text style={styles.paragraph}>
        Trupee may update these terms from time to time. We will notify you of any major changes through the app.
      </Text>

      <Text style={styles.paragraph}>
        Last updated: August 14, 2025
      </Text>
    </ScrollView>
  );
};

export default TermsOfServiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  paragraph: { fontSize: 16, lineHeight: 24, marginTop: 8, color: '#333' },
});
