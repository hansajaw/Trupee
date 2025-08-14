import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar as RNStatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/theme-context";
import { useCategories } from "../context/categories-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useTransactions } from "../context/transactions-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { useUser } from "../context/user-context";
import { formatCurrency } from "../utils/currency";


const screenWidth = Dimensions.get("window").width;

const PROFILE_NAME_KEY = "PROFILE_NAME";
const PROFILE_EMAIL_KEY = "PROFILE_EMAIL";
const PROFILE_PHOTO_URI_KEY = "PROFILE_PHOTO_URI";

const StatCard = ({ title, subtitle, icon, color, value }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: theme.white }]}>
  
      <View style={styles.statHeader}>
        
        <View style={{ flex: 1 }}>
          <Text style={[styles.statTitleTop, { color: theme.textDark }]}>{title}</Text>
          {!!subtitle && (
            <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>

      <Text style={[styles.statAmount, { color: theme.textDark }]}>
        {formatCurrency(Number(value) || 0)}
      </Text>
    </View>
  );
};


const TransactionItem = ({ item, formatCurrency }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.transactionItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name={item.icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionTitle, { color: theme.textDark }]}>
          {item.title || "Untitled"}
        </Text>
        <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>
          {item.type === "Loan" ? `Loan (${item.loanType})` : item.category || item.type}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.amount >= 0 ? theme.success : theme.error },
        ]}
      >
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );
};

const TransactionForm = ({ selectedType, theme, onSave, onClose }) => {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [loanType, setLoanType] = useState("Given");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [tags, setTags] = useState("");
  const { getIncomeCategories, getExpenseCategories, getLoanCategories } = useCategories();
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [repayBy, setRepayBy] = useState(null);
  const [loanRemindDays, setLoanRemindDays] = useState(1);
  const [showRepayPicker, setShowRepayPicker] = useState(false);

  const CURRENT_CATEGORIES = useMemo(() => {
    if (selectedType === "Income") return getIncomeCategories();
    if (selectedType === "Loan") return getLoanCategories();
    return getExpenseCategories(); 
  }, [selectedType, getIncomeCategories, getLoanCategories, getExpenseCategories]);

  const getAmountColor = () => {
    if (selectedType === "Income") return theme.success;
    if (selectedType === "Expenses") return theme.error;
    return theme.textSecondary;
  };

  const getAmountPrefix = () => {
    if (selectedType === "Income") return "+";
    if (selectedType === "Expenses") return "-";
    return "";
  };

  const handleSave = () => {
    if (!amount || !category) {
      Alert.alert("Error", "Please fill required fields (Amount & Category)");
      return;
    }

    const numAmount = parseFloat(amount);
    const finalAmount =
      selectedType === "Expenses" || (selectedType === "Loan" && loanType === "Given")
        ? -Math.abs(numAmount)
        : Math.abs(numAmount);
    
    const localNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);    

    onSave({
      title: title || "Untitled",
      category,
      amount: finalAmount,
      type: selectedType,
      date: localNoon.toISOString(),
      note,
      paymentMethod,
      tags,
      loanType: selectedType === "Loan" ? loanType : null,
      icon:
        selectedType === "Income"
          ? "arrow-up-circle"
          : selectedType === "Expenses"
          ? "arrow-down-circle"
          : "swap-horizontal",
      location: pickedLocation,
      repayBy: selectedType === "Loan" ? (repayBy ? repayBy.toISOString() : null) : null,
      loanRemindBeforeDays: selectedType === "Loan" ? Number(loanRemindDays) || 1 : undefined,
    });

    setAmount("");
    setTitle("");
    setCategory("");
    setNote("");
    setTags("");
    onClose();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "You need to give permission to access media.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const pickLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync(loc.coords);
    if (address.length > 0) {
      const a = address[0];
      const fullAddress = [a.name, a.street, a.city, a.region, a.country].filter(Boolean).join(", ");
      setLocationAddress(fullAddress);
    } else {
      setLocationAddress(`Lat: ${loc.coords.latitude.toFixed(3)}, Lng: ${loc.coords.longitude.toFixed(3)}`);
    }
    setPickedLocation(loc.coords);
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <View style={[styles.amountSection, { backgroundColor: theme.backgroundSecondary }]}>
        <Text style={[styles.amountLabel, { color: theme.textDark }]}>{i18n.t("amount") || "Amount"}</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.currency, { color: theme.textSecondary }]}>LKR</Text>
          <Text style={[styles.amountPrefix, { color: getAmountColor() }]}>{getAmountPrefix()}</Text>
          <TextInput
            style={[styles.amountInput, { color: getAmountColor() }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textDark }]}>{i18n.t("general") || "General"}</Text>

        {isTitleEditing ? (
          <View style={[styles.formRow, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name="text-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textDark }]}>{i18n.t("title") || "Title"}</Text>
            </View>
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              onBlur={() => setIsTitleEditing(false)}
              placeholder={i18n.t("enterTitle") || "Enter title"}
              placeholderTextColor={theme.placeholderText}
              style={[styles.inlineInput, { color: theme.textDark }]}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.formRow, { borderBottomColor: theme.border }]}
            onPress={() => setIsTitleEditing(true)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="text-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textDark }]}>{i18n.t("title") || "Title"}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: title ? theme.textDark : theme.placeholderText }]}
              >
                {title || (i18n.t("enterTitle") || "Enter title")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.formRow,
            { borderBottomColor: theme.border, flexDirection: "column", alignItems: "stretch" },
          ]}
        >
          <TouchableOpacity
            style={[styles.formRow, { borderBottomColor: theme.border }]}
            onPress={() => setOpenCategoryDropdown(!openCategoryDropdown)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="pricetags-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textDark }]}>{i18n.t("category") || "Category"}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: category ? theme.textDark : theme.placeholderText }]}
              >
                {category || i18n.t("selectCategory") || "Select category"}
              </Text>
              <Ionicons
                name={openCategoryDropdown ? "chevron-up" : "chevron-forward"}
                size={16}
                color={theme.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {openCategoryDropdown && (
            <View style={styles.categoryGrid}>
              {CURRENT_CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={`${cat.name}-${i}`}
                  style={[
                    styles.categoryItem,
                    {
                      borderColor: category === cat.name ? theme.primary : theme.border,
                      backgroundColor: category === cat.name ? theme.primaryLight : theme.white,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setOpenCategoryDropdown(false);
                  }}
                >
                  <View
                    style={[styles.categoryColor, { backgroundColor: cat.color || "#9CA3AF" }]}
                  />
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: theme.textDark }} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    {cat.type ? (
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>{cat.type}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedType === "Loan" && (
          <TouchableOpacity
            style={[styles.formRow, { borderBottomColor: theme.border }]}
            onPress={() => setLoanType(loanType === "Given" ? "Received" : "Given")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textDark }]}>{i18n.t("type") || "Type"}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{loanType}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.formRow, { borderBottomColor: theme.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.rowLabel, { color: theme.textDark }]}>
              {i18n.t("date") || "Date"}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
              {date.toLocaleDateString()}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textDark }]}>
          {i18n.t("moreDetails") || "More Details"}
        </Text>

        <TouchableOpacity
          style={[styles.formRow, { borderBottomColor: theme.border }]}
          onPress={() => setShowNoteInput(!showNoteInput)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.rowLabel, { color: theme.textDark }]}>
              {i18n.t("note") || "Short note"}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Ionicons
              name={showNoteInput ? "chevron-up" : "chevron-forward"}
              size={16}
              color={theme.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {showNoteInput && (
          <View style={{ paddingVertical: 10 }}>
            <TextInput
              style={[
                styles.inlineInput,
                {
                  color: theme.textDark,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  minHeight: 100,
                  textAlignVertical: "top",
                  textAlign: "left",
                },
              ]}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder={i18n.t("addImportantNote") || "Add your important note..."}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.formRow, { borderBottomColor: theme.border }]}
          onPress={() => {
            const methods = ["Cash", "Card", "Bank Transfer", "Digital Wallet"];
            const currentIndex = methods.indexOf(paymentMethod);
            const nextIndex = (currentIndex + 1) % methods.length;
            setPaymentMethod(methods[nextIndex]);
          }}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="card-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.rowLabel, { color: theme.textDark }]}>
              {i18n.t("paymentMethod") || "Payment method"}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{paymentMethod}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.formRow, { borderBottomColor: theme.border }]}
          onPress={pickLocation}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="location-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.rowLabel, { color: theme.textDark }]}>
              {i18n.t("pickLocation") || "Pick Location"}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowValue, { color: theme.textSecondary, maxWidth: 150 }]}>
              {pickedLocation
                ? `Lat: ${pickedLocation.latitude.toFixed(3)}, Lng: ${pickedLocation.longitude.toFixed(3)}`
                : i18n.t("select") || "Select"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        {locationAddress ? (
          <Text style={{ color: theme.textSecondary, marginLeft: 44, marginTop: 6 }}>
            {locationAddress}
          </Text>
        ) : null}

        {showMapPicker && (
          <Modal animationType="slide" visible={showMapPicker}>
            <View style={{ flex: 1 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: pickedLocation?.latitude || 6.9271, 
                  longitude: pickedLocation?.longitude || 79.8612,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(event) => {
                  setPickedLocation(event.nativeEvent.coordinate);
                }}
              >
                {pickedLocation && <Marker coordinate={pickedLocation} />}
              </MapView>

              <View style={{ padding: 16, backgroundColor: theme.white }}>
                <TouchableOpacity
                  onPress={() => setShowMapPicker(false)}
                  style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8 }}
                >
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
                    {i18n.t("confirmLocation") || "Confirm Location"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <TouchableOpacity
          style={[styles.formRow, { borderBottomWidth: 0 }]}
          onPress={() =>
            Alert.alert(i18n.t("uploadReceipt") || "Upload Receipt", i18n.t("chooseOption") || "Choose an option", [
              { text: i18n.t("takePhoto") || "Take Photo", onPress: takePhoto },
              { text: i18n.t("chooseFromGallery") || "Choose from Gallery", onPress: pickImage },
              { text: i18n.t("cancel") || "Cancel", style: "cancel" },
            ])
          }
        >
          <View style={styles.rowLeft}>
            <Ionicons name="receipt-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.rowLabel, { color: theme.textDark }]}>
              {i18n.t("addReceipt") || "Add receipt"}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        {receiptImage && (
          <Image
            source={{ uri: receiptImage }}
            style={{ width: "100%", height: 200, marginTop: 12, borderRadius: 12 }}
            resizeMode="cover"
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>{i18n.t("saveTransaction") || "Save Transaction"}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              transparent
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <View style={{ backgroundColor: theme.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: theme.textDark, marginBottom: 10 }}>
                    {i18n.t("pickDate") || "Pick Date"}
                  </Text>
                  <View style={{ height: 220 }}>
                    <DateTimePicker
                      value={date}
                      mode="date"       
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setDate(selectedDate);
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, color: theme.primary, fontWeight: "600" }}>
                      {i18n.t("done") || "Done"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={date}
              mode="date"                 
              display="calendar"
              onChange={(event, selectedDate) => {
                if (event.type === "set" && selectedDate) setDate(selectedDate);
                setShowDatePicker(false);
              }}
            />
          )}
        </>
      )}
    </ScrollView>
  );
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const [showBalance, setShowBalance] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("Income");
  const { transactions, balance, addTransaction } = useTransactions();
  const router = useRouter();

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [n, e, p] = await Promise.all([
          AsyncStorage.getItem(PROFILE_NAME_KEY),
          AsyncStorage.getItem(PROFILE_EMAIL_KEY),
          AsyncStorage.getItem(PROFILE_PHOTO_URI_KEY),
        ]);
        if (n) setProfileName(n);
        if (e) setProfileEmail(e);
        if (p) setProfilePhoto(p);
      } catch {}
    })();
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(amt);

  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalLoanGiven = transactions
    .filter((t) => t.type === "Loan" && t.loanType === "Given")
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalLoanReceived = transactions
    .filter((t) => t.type === "Loan" && (t.loanType === "Received" || t.loanType === "Taken"))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const recentTransactions = [...transactions].reverse().slice(0, 6);

  const groupedByDate = {};
  transactions.forEach((t) => {
    const dateKey = new Date(t.date).toISOString().split("T")[0];
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = { total: 0, types: [] };
    groupedByDate[dateKey].total += t.amount;
    if (!groupedByDate[dateKey].types.includes(t.type)) groupedByDate[dateKey].types.push(t.type);
  });

  const sortedDates = Object.keys(groupedByDate).sort();
  let runningBalance = 0;
  const cumulativeBalances = [];
  const labels = [];
  sortedDates.forEach((d) => {
    runningBalance += groupedByDate[d].total;
    cumulativeBalances.push(runningBalance);
    const date = new Date(d);
    labels.push(date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
  });

  const chartData = {
    labels,
    datasets: [{ data: cumulativeBalances }],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.white,
    backgroundGradientTo: theme.white,
    color: () => (balance >= 0 ? theme.success : theme.error),
    labelColor: () => theme.textSecondary,
    decimalPlaces: 0,
    propsForDots: { r: "4", strokeWidth: "2", stroke: theme.white },
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return i18n.t("goodMorning") || "Good Morning";
    if (h < 18) return i18n.t("goodAfternoon") || "Good Afternoon";
    return i18n.t("goodEvening") || "Good Evening";
  }, []);

  const dateLocale = i18n.locale?.startsWith("si") ? "si-LK" : "en-GB";
  const todayLabel = new Date().toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <RNStatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={() => router.push("/editProfile")} activeOpacity={0.85}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={[styles.profileImage, { borderColor: theme.primary }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.profileImage,
                      {
                        borderColor: theme.primary,
                        backgroundColor: theme.inputBackground,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Ionicons name="person" size={26} color={theme.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>

              <View>
                <Text style={[styles.greeting, { color: theme.textDark }]}>
                  {greeting}{profileName ? `, ${profileName.split(" ")[0]}` : ""}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {i18n.t("trackYourFinances") || "Track your finances"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/notification")}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.textDark} />
            </TouchableOpacity>
          </View>

          <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>
                  {i18n.t("availableBalance") || "Available Balance"}
                </Text>
                <Text style={styles.balanceSubLabel}>{todayLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowBalance(!showBalance)}
              >
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContent}>
              <Text style={styles.balanceValue}>
                {showBalance ? formatCurrency(balance) : "•••••••"}
              </Text>
              <View style={styles.balanceIndicator}>
                <Ionicons
                  name={balance >= 0 ? "trending-up" : "trending-down"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.balanceStatus}>
                  {balance >= 0
                    ? (i18n.t("healthy") || "Healthy")
                    : (i18n.t("monitor") || "Monitor")}
                </Text>
              </View>
            </View>
          </View>
          <View>
            <View style={styles.statsGrid}>
              <StatCard
                title={i18n.t("totalIncome") || "Total Income"}
                subtitle={i18n.t("inflow") || "Inflow"}
                icon="arrow-up-circle-outline"
                color={theme.success}
                value={totalIncome}
              />
              <StatCard
                title={i18n.t("totalExpenses") || "Total Expenses"}
                subtitle={i18n.t("outflow") || "Outflow"}
                icon="arrow-down-circle-outline"
                color={theme.error}
                value={totalExpenses}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title={i18n.t("loanGiven") || "Loan Given"}
                subtitle={i18n.t("outflow") || "Outflow"}
                icon="arrow-redo-outline"
                color="#f59e0b"
                value={totalLoanGiven}
              />
              <StatCard
                title={i18n.t("loanTaken") || "Loan Taken"}
                subtitle={i18n.t("inflow") || "Inflow"}
                icon="arrow-undo-outline"
                color="#3b82f6"
                value={totalLoanReceived}
              />
            </View>
          </View>

          <View style={[styles.flowTracker, { backgroundColor: theme.white }]}>
            <View style={styles.flowHeader}>
              <Text style={[styles.flowTitle, { color: theme.textDark }]}>
                 {i18n.t("rupeeFlowTracker") || "Rupee Flow Tracker"}
              </Text>
              <Text style={[styles.flowSubtitle, { color: theme.textSecondary }]}>
                {transactions.length} {i18n.t("transactions") || "transactions"}
              </Text>
            </View>

            {transactions.length > 0 ? (
              <>
                <LineChart
                  data={chartData}
                  width={screenWidth - 64}
                  height={200}
                  fromZero={false}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 12, marginTop: 16 }}
                />

                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      {i18n.t("highest") || "Highest"}
                    </Text>
                    <Text style={[styles.statValue, { color: theme.success }]}>
                      {formatCurrency(Math.max(...cumulativeBalances))}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      {i18n.t("lowest") || "Lowest"}
                    </Text>
                    <Text style={[styles.statValue, { color: theme.error }]}>
                      {formatCurrency(Math.min(...cumulativeBalances))}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      {i18n.t("net") || "Net"}
                    </Text>
                    <Text style={[styles.statValue, { color: theme.textDark }]}>
                      {formatCurrency(
                        cumulativeBalances[cumulativeBalances.length - 1] -
                          cumulativeBalances[0]
                      )}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyFlow}>
                <Ionicons name="analytics-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {i18n.t("addTransactionsToSeeFlow") || "Add transactions to see flow"}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.transactionsCard, { backgroundColor: theme.white }]}>
            <View style={styles.transactionsHeader}>
              <Text style={[styles.transactionsTitle, { color: theme.textDark }]}>
                {i18n.t("recentTransactions") || "Recent Transactions"}
              </Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {i18n.t("noTransactionsYet") || "No transactions yet"}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                  {i18n.t("addYourFirstTransaction") || "Add your first transaction"}
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={transactions.slice(0, 3)}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TransactionItem item={item} formatCurrency={formatCurrency} />
                  )}
                />
                <TouchableOpacity
                  onPress={() => router.push("/allTransactions")}
                  style={{ marginTop: 10, alignSelf: "center" }}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600", fontSize: 14 }}>
                    {i18n.t("viewAll") || "View All"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={theme.textDark} />
                </TouchableOpacity>
              </View>

              <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary }]}>
                {["Income", "Expenses", "Loan"].map((type) => {
                  const active = selectedType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.tabButton, active && { backgroundColor: theme.primary }]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: active ? "#fff" : theme.textDark },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                <TransactionForm
                  selectedType={selectedType}
                  theme={theme}
                  onSave={addTransaction}
                  onClose={() => setModalVisible(false)}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  userInfo: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 52, height: 52, borderRadius: 26, marginRight: 12, borderWidth: 2 },
  greeting: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14 },
  notificationButton: { padding: 8 },

  balanceCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 16, color: "#fff", fontWeight: "600" },
  balanceSubLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  eyeButton: { padding: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)" },
  balanceContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  balanceValue: { fontSize: 32, fontWeight: "700", color: "#fff", flex: 1 },
  balanceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceStatus: { fontSize: 12, color: "#fff", fontWeight: "600", marginLeft: 4 },

  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, borderLeftWidth: 4 },
  statValue: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  statHeader: {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
},
statTitleTop: {
  fontSize: 14,
  fontWeight: "700",
},
statSubtitle: {
  fontSize: 12,
  marginTop: 2,
},


  flowTracker: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  flowTitle: { fontSize: 18, fontWeight: "700" },
  flowSubtitle: { fontSize: 14 },
  quickStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  statItem: { alignItems: "center" },
  statLabel: { fontSize: 12, marginBottom: 4 },
  emptyFlow: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },

  transactionsCard: { borderRadius: 20, padding: 20 },
  transactionsHeader: { marginBottom: 16 },
  transactionsTitle: { fontSize: 18, fontWeight: "700" },
  transactionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionTitle: { fontSize: 16, fontWeight: "600" },
  transactionAmount: { fontSize: 16, fontWeight: "700" },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "90%", minHeight: 600 },
  modalHeader: { alignItems: "center", paddingTop: 12, paddingHorizontal: 20, paddingBottom: 8 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  closeButton: { position: "absolute", top: 12, right: 20, padding: 4 },

  tabContainer: { flexDirection: "row", marginHorizontal: 20, marginBottom: 20, borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 2 },
  tabText: { fontSize: 14, fontWeight: "600" },

  formContainer: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  amountSection: { borderRadius: 16, padding: 20, marginBottom: 20, alignItems: "center" },
  amountLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "center" },
  currency: { fontSize: 18, marginRight: 8, fontWeight: "500" },
  amountPrefix: { fontSize: 28, fontWeight: "700", marginRight: 4 },
  amountInput: { fontSize: 32, fontWeight: "700", textAlign: "center", minWidth: 120 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  formRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1 },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: "500", marginLeft: 12 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowValue: { fontSize: 14, marginRight: 8 },
  inlineInput: { fontSize: 14, textAlign: "right", minWidth: 80, marginRight: 8 },

  saveButton: { marginTop: 20, marginBottom: 20, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8, marginBottom: 0 },
  categoryItem: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 8, borderWidth: 1, marginRight: 10, marginBottom: 10 },
  categoryColor: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
});
