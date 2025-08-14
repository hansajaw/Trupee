import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/theme-context";
import { usePayments } from "../context/payment-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Add() {
  const { theme } = useTheme();
  const { payments, setPayments } = usePayments();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("Other");

  const handleAddTransaction = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const response = await fetch("https://your-api-domain.com/api/transaction/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, amount: parseFloat(amount), type, category, date: new Date() }),
      });
      if (response.ok) {
        const newTransaction = await response.json();
        setPayments([...payments, newTransaction]);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textDark }]}>Add Transaction</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={theme.placeholderText}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholderTextColor={theme.placeholderText}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        placeholderTextColor={theme.placeholderText}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleAddTransaction}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    color: "#1E293B",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
