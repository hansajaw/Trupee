import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  Alert,
  Share as RNShare,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { useTheme } from "../context/theme-context";
import { useTransactions } from "../context/transactions-context";
import { useCategories } from "../context/categories-context";
import i18n from "../i18n";
import { formatCurrency } from "../utils/currency";

const PLANS_KEY = "BUDGET_PLANS";

const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const yyyymm = (d) => d.toISOString().slice(0, 7);

export default function FinancialReport() {
  const router = useRouter(); 
  const { theme } = useTheme();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const [start, setStart] = useState(startOfMonth());
  const [end, setEnd] = useState(endOfMonth());
  const [showPicker, setShowPicker] = useState({ which: null }); 
  const [budgetPlan, setBudgetPlan] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLANS_KEY);
        if (!raw) return setBudgetPlan(null);
        const all = JSON.parse(raw);
        const plan = [...all].reverse().find((p) => p.month === yyyymm(start)) || null;
        setBudgetPlan(plan);
      } catch {
        setBudgetPlan(null);
      }
    })();
  }, [start]);

  const filtered = useMemo(() => {
    const s = new Date(start).getTime();
    const e = new Date(end).setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      const ts = new Date(t.date).getTime();
      return ts >= s && ts <= e;
    });
  }, [transactions, start, end]);

  const totalIncome = filtered.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filtered.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = totalIncome - totalExpenses;

  const spendByCategory = useMemo(() => {
    const map = {};
    filtered
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const key = t.category || "Other";
        map[key] = (map[key] || 0) + Math.abs(t.amount);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]); 
  }, [filtered]);

  const spendByPriority = useMemo(() => {
    const map = { Need: 0, Must: 0, Want: 0 };
    filtered
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const cat = categories.find((c) => c.name === t.category);
        const type = cat?.type;
        if (type && map[type] !== undefined) {
          map[type] += Math.abs(t.amount);
        }
      });
    return map;
  }, [filtered, categories]);

  const loansGiven = filtered
    .filter((t) => t.type === "Loan" && t.loanType === "Given")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const loansReceived = filtered
    .filter((t) => t.type === "Loan" && (t.loanType === "Received" || t.loanType === "Taken"))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const quickSet = (type) => {
    const now = new Date();
    if (type === "thisMonth") {
      setStart(startOfMonth(now));
      setEnd(endOfMonth(now));
    } else if (type === "last30") {
      const e = new Date();
      const s = new Date();
      s.setDate(s.getDate() - 29);
      setStart(new Date(s.getFullYear(), s.getMonth(), s.getDate()));
      setEnd(new Date(e.getFullYear(), e.getMonth(), e.getDate()));
    }
  };

  const pickDate = (which) => setShowPicker({ which });
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS !== "ios") setShowPicker({ which: null });
    if (!selectedDate) return;
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    if (showPicker.which === "start") setStart(d);
    if (showPicker.which === "end") setEnd(d);
  };

  const rangeIsSingleMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === 1 &&
    end.getDate() === endOfMonth(start).getDate();

  const budgetCompare = useMemo(() => {
    if (!budgetPlan || !rangeIsSingleMonth) return null;

    const budgetByCat = {};
    budgetPlan.expenses?.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (!e.category) return;
      budgetByCat[e.category] = (budgetByCat[e.category] || 0) + amt;
    });

    const actualByCat = {};
    filtered
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const key = t.category || "Other";
        actualByCat[key] = (actualByCat[key] || 0) + Math.abs(t.amount);
      });

    const cats = Array.from(new Set([...Object.keys(budgetByCat), ...Object.keys(actualByCat)]));
    const rows = cats
      .map((c) => {
        const b = budgetByCat[c] || 0;
        const a = actualByCat[c] || 0;
        const diff = b - a;
        return { category: c, budget: b, actual: a, diff, good: diff >= 0 };
      })
      .sort((x, y) => y.actual - x.actual);

    const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const goodSaving = totalBudget >= totalActual;

    return { rows, totalBudget, totalActual, goodSaving };
  }, [budgetPlan, filtered, rangeIsSingleMonth]);

  const exportCSV = async () => {
    if (!filtered.length) {
      Alert.alert(
        i18n.t("nothingToExport") || "Nothing to export",
        i18n.t("noTxInRange") || "No transactions in selected range."
      );
      return;
    }
    const header = [
      "Date",
      "Title",
      "Type",
      "Category",
      "Amount",
      "PaymentMethod",
      "LoanType",
      "Note",
      "Latitude",
      "Longitude",
    ];
    const rows = filtered.map((t) => [
      new Date(t.date).toISOString(),
      (t.title || "").replace(/,/g, " "),
      t.type || "",
      t.category || "",
      t.amount,
      t.paymentMethod || "",
      t.loanType || "",
      (t.note || "").replace(/,/g, " "),
      t?.location?.latitude ?? "",
      t?.location?.longitude ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const fileUri =
      FileSystem.documentDirectory + `financial_report_${yyyymm(start)}_${yyyymm(end)}.csv`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await RNShare.share(
        Platform.select({
          ios: { url: fileUri },
          android: { url: fileUri, message: "Financial report" },
          default: { url: fileUri },
        })
      );
    } catch (e) {
      Alert.alert(i18n.t("exportFailed") || "Export failed", e?.message || "Unknown error");
    }
  };

  const Section = ({ title, right, children }) => (
    <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.textDark }]}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );

  const Row = ({ left, right, color }) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.rowLeft, { color: theme.textDark }]}>{left}</Text>
      <Text style={[styles.rowRight, { color: color || theme.textDark }]}>{right}</Text>
    </View>
  );

  const txData = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filtered]
  );

  const renderHeader = () => (
    <View style={{ padding: 16 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={[styles.iconBtn, { backgroundColor: theme.white, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textDark} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.textDark }]}>
            {i18n.t("financialReport") || "Financial Report"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={exportCSV}
          style={[styles.exportBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.exportText}>{i18n.t("exportCSV") || "Export CSV"}</Text>
        </TouchableOpacity>
      </View>

      <Section
        title={i18n.t("dateRange") || "Date Range"}
        right={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.chip, { borderColor: theme.border }]}
              onPress={() => quickSet("thisMonth")}
            >
              <Text style={{ color: theme.textDark }}>
                {i18n.t("thisMonth") || "This Month"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, { borderColor: theme.border }]}
              onPress={() => quickSet("last30")}
            >
              <Text style={{ color: theme.textDark }}>
                {i18n.t("last30Days") || "Last 30 Days"}
              </Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.dateBtn,
              { borderColor: theme.border, backgroundColor: theme.inputBackground },
            ]}
            onPress={() => pickDate("start")}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
            <Text style={{ color: theme.textDark, marginLeft: 6 }}>
              {i18n.t("from") || "From"}: {start.toLocaleDateString("en-GB")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateBtn,
              { borderColor: theme.border, backgroundColor: theme.inputBackground },
            ]}
            onPress={() => pickDate("end")}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
            <Text style={{ color: theme.textDark, marginLeft: 6 }}>
              {i18n.t("to") || "To"}: {end.toLocaleDateString("en-GB")}
            </Text>
          </TouchableOpacity>
        </View>

        {showPicker.which && (
          <>
            {Platform.OS === "ios" ? (
              <Modal
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker({ which: null })}
              >
                <View style={styles.pickerSheet}>
                  <View style={[styles.pickerInner, { backgroundColor: theme.white }]}>
                    <DateTimePicker
                      value={showPicker.which === "start" ? start : end}
                      mode="date"
                      display="spinner"
                      onChange={(_, d) => d && onChangeDate(_, d)}
                      style={{ alignSelf: "stretch" }}
                    />
                    <TouchableOpacity
                      style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                      onPress={() => setShowPicker({ which: null })}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        {i18n.t("done") || "Done"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={showPicker.which === "start" ? start : end}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
          </>
        )}
      </Section>

      <Section title={i18n.t("summary") || "Summary"}>
        <Row
          left={i18n.t("income") || "Income"}
          right={formatCurrency(totalIncome)}
          color={theme.success}
        />
        <Row
          left={i18n.t("expenses") || "Expenses"}
          right={formatCurrency(totalExpenses)}
          color={theme.error}
        />
        <Row
          left={i18n.t("net") || "Net"}
          right={formatCurrency(net)}
          color={net >= 0 ? theme.success : theme.error}
        />
      </Section>

      <Section title={i18n.t("byCategory") || "Spending by Category"}>
        {spendByCategory.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: "center", paddingVertical: 8 }}>
            {i18n.t("noExpensesInRange") || "No expenses in this range"}
          </Text>
        ) : (
          spendByCategory.map(([name, amt]) => (
            <Row key={name} left={name} right={formatCurrency(amt)} />
          ))
        )}
      </Section>

      <Section title={i18n.t("byPriority") || "Spending by Priority"}>
        <Row left="Need" right={formatCurrency(spendByPriority.Need || 0)} />
        <Row left="Must" right={formatCurrency(spendByPriority.Must || 0)} />
        <Row left="Want" right={formatCurrency(spendByPriority.Want || 0)} />
      </Section>

      {/* Loans */}
      <Section title={i18n.t("loanSummary") || "Loan Summary"}>
        <Row left={i18n.t("given") || "Given"} right={formatCurrency(loansGiven)} />
        <Row left={i18n.t("received") || "Received"} right={formatCurrency(loansReceived)} />
        <Row
          left={i18n.t("net") || "Net"}
          right={`${
            loansReceived - loansGiven >= 0
              ? i18n.t("receivable") || "Receivable"
              : i18n.t("payable") || "Payable"
          } ${formatCurrency(Math.abs(loansReceived - loansGiven))}`}
          color={loansReceived - loansGiven >= 0 ? theme.success : theme.error}
        />
      </Section>

      <Section title={i18n.t("budgetVsActual") || "Budget vs Actual"}>
        {!rangeIsSingleMonth ? (
          <Text style={{ color: theme.textSecondary }}>
            {i18n.t("budgetRangeHint") ||
              "Set the range to the exact month (1st to last day) to compare with your budget plan."}
          </Text>
        ) : !budgetPlan ? (
          <Text style={{ color: theme.textSecondary }}>
            {i18n.t("noBudgetForMonth") || "No budget plan found for this month."}
          </Text>
        ) : (
          <>
            {budgetCompare?.rows?.map((r) => (
              <View key={r.category} style={[styles.row, { borderBottomColor: theme.border }]}>
                <Text style={[styles.rowLeft, { color: theme.textDark }]}>{r.category}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {(i18n.t("budget") || "Budget")}: {formatCurrency(r.budget)}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {(i18n.t("actual") || "Actual")}: {formatCurrency(r.actual)}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontWeight: "700",
                      color: r.good ? theme.success : theme.error,
                    }}
                  >
                    {r.good ? i18n.t("saved") || "Saved" : i18n.t("overspent") || "Overspent"}:{" "}
                    {formatCurrency(Math.abs(r.diff))}
                  </Text>
                </View>
              </View>
            ))}

            <View
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
                backgroundColor: budgetCompare?.goodSaving
                  ? theme.primary + "20"
                  : theme.error + "20",
                borderWidth: 1,
                borderColor: budgetCompare?.goodSaving ? theme.primary : theme.error,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: budgetCompare?.goodSaving ? theme.primary : theme.error,
                }}
              >
                {budgetCompare?.goodSaving ? "✅ Good saving" : "⚠️ Bad saving"}
              </Text>
              <Text style={{ textAlign: "center", marginTop: 4, color: theme.textDark }}>
                {(i18n.t("budget") || "Budget")}: {formatCurrency(budgetCompare?.totalBudget || 0)} |{" "}
                {(i18n.t("actual") || "Actual")}: {formatCurrency(budgetCompare?.totalActual || 0)} |{" "}
                {budgetCompare?.goodSaving ? i18n.t("saved") || "Saved" : i18n.t("overspent") || "Overspent"}:{" "}
                {formatCurrency(
                  Math.abs((budgetCompare?.totalBudget || 0) - (budgetCompare?.totalActual || 0))
                )}
              </Text>
            </View>
          </>
        )}
      </Section>

      <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.textDark }]}>
            {(i18n.t("transactions") || "Transactions") + ` (${txData.length})`}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            {start.toLocaleDateString("en-GB")} — {end.toLocaleDateString("en-GB")}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      data={txData}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <View
          style={[
            styles.txRow,
            { borderBottomColor: theme.border, backgroundColor: theme.white },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textDark, fontWeight: "600" }}>
              {item.title || "Untitled"}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {new Date(item.date).toLocaleString()} • {item.category || item.type}
            </Text>
          </View>
          <Text
            style={{
              color: item.amount >= 0 ? theme.success : theme.error,
              fontWeight: "700",
            }}
          >
            {formatCurrency(item.amount)}
          </Text>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700" },

  header: {
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  exportText: { color: "#fff", fontWeight: "600" },

  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },

  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  filterRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  pickerSheet: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  pickerInner: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  doneBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 10, alignItems: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowLeft: { flex: 1, fontSize: 14 },
  rowRight: { fontSize: 14, fontWeight: "700" },

  txRow: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
});
