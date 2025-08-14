import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useCategories } from "../context/categories-context";
import { useTransactions } from "../context/transactions-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import i18n from "../i18n";
import * as currencyUtil from "../utils/currency";

const PLANS_KEY = "BUDGET_PLANS";
const currentMonth = () => new Date().toISOString().slice(0, 7);

const safeFormatCurrency = (n) => {
  try {
    if (typeof currencyUtil.formatCurrency === "function") {
      const r1 = currencyUtil.formatCurrency(n);
      if (typeof r1 === "string") return r1;
      const r2 = currencyUtil.formatCurrency({ amount: n });
      if (typeof r2 === "string") return r2;
    }
  } catch {}
  try {
    if (i18n?.locale?.startsWith("si")) return `රු ${Number(n || 0).toLocaleString("si-LK")}`;
    return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(n);
  } catch {
    return `LKR ${Number(n || 0).toLocaleString()}`;
  }
};

const StatCard = ({ title, amount, icon, color, theme }) => (
  <View style={[styles.statCard, { backgroundColor: theme.white }]}>
    <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statAmount, { color: theme.textDark }]}>
      {safeFormatCurrency(Math.abs(amount))}
    </Text>
    <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
  </View>
);

export default function Statistics() {
  const { theme } = useTheme();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const router = useRouter();

  const W = Dimensions.get("window").width;
  const pageWidth = W - 32;        
  const chartWidth = pageWidth - 32; 

  const income = transactions.filter((t) => t.type === "Income");
  const expenses = transactions.filter((t) => t.type === "Expense" || t.type === "Expenses");
  const loansGiven = transactions.filter((t) => t.type === "Loan" && t.loanType === "Given");
  const loansTaken = transactions.filter(
    (t) => t.type === "Loan" && (t.loanType === "Taken" || t.loanType === "Received")
  );

  const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalLoansGiven = loansGiven.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalLoansTaken = loansTaken.reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  const spendingByCategory = {};
  expenses.forEach((e) => {
    const key = e.category || "Other";
    spendingByCategory[key] = (spendingByCategory[key] || 0) + Math.abs(e.amount);
  });

  const spendingByPriority = { Need: 0, Must: 0, Want: 0 };
  expenses.forEach((e) => {
    const cat = categories.find((c) => c.name === e.category);
    if (cat && spendingByPriority.hasOwnProperty(cat.type)) {
      spendingByPriority[cat.type] += Math.abs(e.amount);
    }
  });

  const topCategories = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const priorityPieData = Object.entries(spendingByPriority)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount], i) => {
      const colors = ["#E74C3C", "#F39C12", "#3498DB"];
      return {
        name,
        amount,
        color: colors[i] || "#95A5A6",
        legendFontColor: theme.textDark,
        legendFontSize: 12,
      };
    });

  const categoryPieData = topCategories.map(([name, amount], i) => {
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];
    return {
      name,
      amount,
      color: colors[i],
      legendFontColor: theme.textDark,
      legendFontSize: 12,
    };
  });

  const monthly = {};
  transactions.forEach((t) => {
    const key = new Date(t.date).toISOString().slice(0, 7); 
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0, net: 0 };
    if (t.type === "Income") monthly[key].income += Math.abs(t.amount);
    if (t.type === "Expense" || t.type === "Expenses") monthly[key].expenses += Math.abs(t.amount);
    monthly[key].net = monthly[key].income - monthly[key].expenses;
  });

  const monthsSorted = Object.keys(monthly).sort(); 
  const last6 = monthsSorted.slice(-6);
  const expenseFlowLabels = last6.map((m) =>
    new Date(m + "-01").toLocaleDateString("en-GB", { month: "short" })
  );
  const expenseFlowSeries = last6.map((m) => monthly[m]?.expenses || 0);

  const byDay = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    const val = t.amount; 
    byDay[day] = (byDay[day] || 0) + val;
  });
  const daysSorted = Object.keys(byDay).sort();
  let running = 0;
  const balanceLabels = [];
  const balanceSeries = [];
  daysSorted.forEach((day, idx) => {
    running += byDay[day];
    const step = Math.max(1, Math.ceil(daysSorted.length / 8));
    balanceLabels.push(
      idx % step === 0
        ? new Date(day).toLocaleDateString("en-GB", { month: "short", day: "2-digit" })
        : ""
    );
    balanceSeries.push(running);
  });

  const month = currentMonth();
  const [budgetPlan, setBudgetPlan] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLANS_KEY);
        if (!raw) return;
        const all = JSON.parse(raw);
        const plan = [...all].reverse().find((p) => p.month === month) || null;
        setBudgetPlan(plan);
      } catch {}
    })();
  }, [month]);

  const budgetByCat = {};
  if (budgetPlan?.expenses) {
    budgetPlan.expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (!e.category) return;
      budgetByCat[e.category] = (budgetByCat[e.category] || 0) + amt;
    });
  }

  const isCurrMonth = (d) => new Date(d).toISOString().slice(0, 7) === month;
  const actualByCat = {};
  expenses.filter((t) => isCurrMonth(t.date)).forEach((t) => {
    const cat = t.category || "Other";
    const amt = Math.abs(t.amount) || 0;
    actualByCat[cat] = (actualByCat[cat] || 0) + amt;
  });

  const cats = Array.from(new Set([...Object.keys(budgetByCat), ...Object.keys(actualByCat)]));
  const budgetLabels = cats.map((n) => (n.length > 9 ? n.slice(0, 9) + "…" : n));
  const budgetDataset = cats.map((n) => budgetByCat[n] || 0);
  const actualDataset = cats.map((n) => actualByCat[n] || 0);
  const totalBudget = budgetDataset.reduce((a, b) => a + b, 0);
  const totalActual = actualDataset.reduce((a, b) => a + b, 0);
  const goodSaving = totalBudget >= totalActual;

  const chartConfig = {
    backgroundGradientFrom: theme.white,
    backgroundGradientTo: theme.white,
    color: () => theme.textDark,
    labelColor: () => theme.textDark,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForDots: { r: "3" },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.textDark }]}>
          {i18n.t("statistics") || "Statistics"}
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            title={i18n.t("totalIncome") || "Total Income"}
            amount={totalIncome}
            icon="arrow-up"
            color="#22C55E"
            theme={theme}
          />
          <StatCard
            title={i18n.t("totalExpenses") || "Total Expenses"}
            amount={totalExpenses}
            icon="arrow-down"
            color="#EF4444"
            theme={theme}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title={i18n.t("loansGiven") || "Loans Given"}
            amount={totalLoansGiven}
            icon="arrow-forward"
            color="#F59E0B"
            theme={theme}
          />
          <StatCard
            title={i18n.t("loansReceived") || "Loans Received"}
            amount={totalLoansTaken}
            icon="arrow-back"
            color="#3B82F6"
            theme={theme}
          />
        </View>

        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: theme.primary,
              borderColor: netBalance >= 0 ? "#22C55E" : "#EF4444",
              borderWidth: 2,
            },
          ]}
        >
          <Text style={styles.balanceLabel}>
            {i18n.t("netBalance") || "Net Balance"}
          </Text>
          <Text style={styles.balanceAmount}>{safeFormatCurrency(netBalance)}</Text>
          <Text style={styles.balanceStatus}>
            {netBalance >= 0
              ? `📈 ${i18n.t("positiveFlow") || "Positive Flow"}`
              : `📉 ${i18n.t("negativeFlow") || "Negative Flow"}`}
          </Text>
        </View>

        {balanceSeries.length > 1 && (
          <View style={[styles.chartCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.chartTitle, { color: theme.textDark }]}>
              💼 {i18n.t("balanceChart") || "Balance Chart"}
            </Text>
            <LineChart
              data={{
                labels: balanceLabels,
                datasets: [{ data: balanceSeries }],
                legend: [i18n.t("cumulativeBalance") || "Cumulative Balance"],
              }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 12, alignSelf: "center" }}
            />
          </View>
        )}

        {expenseFlowSeries.some((v) => v > 0) && (
          <View style={[styles.chartCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.chartTitle, { color: theme.textDark }]}>
              {i18n.t("expenseFlow") || "Expense Flow"}
            </Text>
            <LineChart
              data={{
                labels: expenseFlowLabels,
                datasets: [{ data: expenseFlowSeries }],
                legend: [i18n.t("monthlyExpenses") || "Monthly Expenses"],
              }}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              style={{ borderRadius: 12, alignSelf: "center" }}
            />
          </View>
        )}

        {(categoryPieData.length > 0 || priorityPieData.length > 0) && (
          <View style={[styles.chartCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.chartTitle, { color: theme.textDark }]}>
              {i18n.t("spendingAnalysis") || "Spending Analysis"}
            </Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.slidableContainer}
            >
              {categoryPieData.length > 0 && (
                <View style={[styles.slideItem, { width: pageWidth - 32 }]}>
                  <Text style={[styles.slideTitle, { color: theme.textSecondary }]}>
                    {i18n.t("byCategory") || "By Category"}
                  </Text>
                  <PieChart
                    data={categoryPieData}
                    width={pageWidth - 64}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              )}

              {priorityPieData.length > 0 && (
                <View style={[styles.slideItem, { width: pageWidth - 32 }]}>
                  <Text style={[styles.slideTitle, { color: theme.textSecondary }]}>
                    {i18n.t("byPriority") || "By Priority"}
                  </Text>
                  <PieChart
                    data={priorityPieData}
                    width={pageWidth - 64}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.slideIndicator}>
              <View style={[styles.dot, styles.activeDot, { backgroundColor: theme.primary }]} />
              <View style={[styles.dot, { backgroundColor: theme.border }]} />
            </View>
          </View>
        )}

        <View style={[styles.chartCard, { backgroundColor: theme.white }]}>
          <Text style={[styles.chartTitle, { color: theme.textDark }]}>
            {(i18n.t("budgetVsActual") || "Budget vs Actual") + ` : ${month}`}
          </Text>

          {!budgetPlan ? (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
                {i18n.t("noBudgetForMonth") || "No budget plan found for this month."}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/plans")}
                style={{
                  marginTop: 10,
                  alignSelf: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: theme.primary,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {i18n.t("addBudgetPlan") || "Add Budget Plan"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : cats.length === 0 ? (
            <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
              {i18n.t("planHasNoCategories") || "Your plan has no categories yet."}
            </Text>
          ) : (
            <>
              <BarChart
                data={{
                  labels: budgetLabels,
                  datasets: [
                    { data: budgetDataset, color: (o = 1) => theme.primary },
                    { data: actualDataset, color: (o = 1) => theme.error },
                  ],
                  legend: [i18n.t("budget") || "Budget", i18n.t("actual") || "Actual"],
                }}
                width={chartWidth}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: theme.white,
                  backgroundGradientTo: theme.white,
                  color: () => theme.textDark,
                  labelColor: () => theme.textSecondary,
                  fillShadowGradientFrom: theme.primary,
                  fillShadowGradientTo: theme.primary,
                  fillShadowGradientOpacity: 0.25,
                  propsForBackgroundLines: { stroke: theme.border },
                  barPercentage: 0.6,
                  decimalPlaces: 0,
                }}
                style={{
                  borderRadius: 12,
                  alignSelf: "center",
                  backgroundColor: theme.white,
                }}
                fromZero
              />

              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: goodSaving ? theme.primary + "20" : theme.error + "20",
                  borderWidth: 1,
                  borderColor: goodSaving ? theme.primary : theme.error,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "700",
                    color: goodSaving ? theme.primary : theme.error,
                    marginBottom: 4,
                  }}
                >
                  {goodSaving
                    ? `${i18n.t("goodSaving") || "Good saving"}`
                    : `${i18n.t("badSaving") || "Bad saving"}`}
                </Text>
                <Text style={{ textAlign: "center", color: theme.textDark }}>
                  {(i18n.t("budget") || "Budget")}: {safeFormatCurrency(totalBudget)} |{" "}
                  {(i18n.t("actual") || "Actual")}: {safeFormatCurrency(totalActual)} |{" "}
                  {goodSaving ? (i18n.t("saved") || "Saved") : (i18n.t("overspent") || "Overspent")}
                  : {safeFormatCurrency(Math.abs(totalBudget - totalActual))}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.white }]}>
          <Text style={[styles.chartTitle, { color: theme.textDark }]}>
            {i18n.t("loanSummary") || "Loan Summary"}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 8 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary }}>
                {i18n.t("given") || "Given"}
              </Text>
              <Text style={{ color: theme.textDark, fontWeight: "700" }}>
                {safeFormatCurrency(totalLoansGiven)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary }}>
                {i18n.t("received") || "Received"}
              </Text>
              <Text style={{ color: theme.textDark, fontWeight: "700" }}>
                {safeFormatCurrency(totalLoansTaken)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary }}>
                {i18n.t("net") || "Net"}
              </Text>
              <Text style={{ color: theme.textDark, fontWeight: "700" }}>
                {safeFormatCurrency(Math.abs(totalLoansTaken - totalLoansGiven))}
              </Text>
              <Text
                style={{
                  color: (totalLoansTaken - totalLoansGiven) >= 0 ? theme.success : theme.error,
                  fontWeight: "700",
                }}
              >
                {(totalLoansTaken - totalLoansGiven) >= 0
                  ? (i18n.t("receivable") || "Receivable")
                  : (i18n.t("payable") || "Payable")}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/financialReport")}
        >
          <Ionicons name="document-text" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.reportButtonText}>
            {i18n.t("viewDetailedReport") || "View Detailed Report"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  pageTitle: { fontSize: 24, fontWeight: "700", marginBottom: 20 },

  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statAmount: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  statTitle: { fontSize: 12, textAlign: "center" },

  balanceCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 16, color: "#fff", fontWeight: "600" },
  balanceAmount: { fontSize: 28, color: "#fff", fontWeight: "700", marginVertical: 8 },
  balanceStatus: { fontSize: 14, color: "#fff" },

  chartCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },

  slidableContainer: { marginTop: 8 },
  slideItem: { alignItems: "center", paddingHorizontal: 16 },
  slideTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  slideIndicator: { flexDirection: "row", justifyContent: "center", marginTop: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 24, height: 8, borderRadius: 4 },

  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  reportButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
