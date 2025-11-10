import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "../context/theme-context";
import { useTransactions } from "../context/transactions-context";
import { formatCurrency } from "../utils/currency";

export default function AllTransactionsScreen() {
  const { theme } = useTheme();
  const { transactions, markLoanAsPaid } = useTransactions(); 

  const groupByType = (type) => transactions.filter((t) => t.type === type);

  const renderSection = (title, data) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{title}</Text>
      {data.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No records</Text>
      ) : (
        data.map((t) => (
          <View key={t.id} style={[styles.item, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.itemTitle, { color: theme.textDark }]}>{t.title}</Text>
              <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                {new Date(t.date).toLocaleDateString()} {t.time}
              </Text>
            </View>
            <View>
              <Text style={{ color: t.amount >= 0 ? theme.success : theme.error }}>
                {formatCurrency(Math.abs(t.amount))}
              </Text>
              {t.type === "Loan" && t.loanType === "Given" && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Confirm", "Mark this loan as paid?", [
                      {
                        text: "Yes",
                        onPress: () => markLoanAsPaid(t.id), 
                      },
                      { text: "Cancel", style: "cancel" },
                    ])
                  }
                  style={[styles.paidButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ListHeaderComponent={
          <>
            {renderSection("Income", groupByType("Income"))}
            {renderSection("Expenses", groupByType("Expenses"))}
            {renderSection(
              "Loan Given",
              transactions.filter((t) => t.type === "Loan" && t.loanType === "Given")
            )}
            {renderSection(
              "Loan Taken",
              transactions.filter((t) => t.type === "Loan" && t.loanType === "Received")
            )}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  itemDate: { fontSize: 12 },
  empty: { fontStyle: "italic", fontSize: 14 },
  paidButton: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});
