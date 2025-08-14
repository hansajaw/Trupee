import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getPushTokenSafely } from "../utils/push";
import * as Notifications from "expo-notifications";

const NOTIF_ENABLED_KEY = "NOTIFICATIONS_ENABLED";
const NOTIF_PREFS_KEY = "NOTIFICATION_PREFS";
const PLANNED_PAYMENTS_KEY = "PLANNED_PAYMENTS";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext(null);

function NotificationProvider({ children }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [pushToken, setPushToken] = useState(null);

  const [prefs, setPrefs] = useState({
    planned: true,
    txAlerts: true,
    loanReminders: true,
  });

  const [planned, setPlanned] = useState([]);
  const channelReady = useRef(false);

  useEffect(() => {
    (async () => {
      const [en, rawPlans, rawPrefs] = await Promise.all([
        AsyncStorage.getItem(NOTIF_ENABLED_KEY),
        AsyncStorage.getItem(PLANNED_PAYMENTS_KEY),
        AsyncStorage.getItem(NOTIF_PREFS_KEY),
      ]);
      if (en !== null) setIsEnabled(en === "true");
      if (rawPlans) { try { setPlanned(JSON.parse(rawPlans)); } catch {} }
      if (rawPrefs) { try { setPrefs((p) => ({ ...p, ...JSON.parse(rawPrefs) })); } catch {} }
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(isEnabled)); }, [isEnabled]);
  useEffect(() => { AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { AsyncStorage.setItem(PLANNED_PAYMENTS_KEY, JSON.stringify(planned)); }, [planned]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "android" && !channelReady.current) {
        await Notifications.setNotificationChannelAsync("payments", {
          name: "Payments & Finance",
          importance: Notifications.AndroidImportance.HIGH,
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
        channelReady.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") await Notifications.requestPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getPushTokenSafely();
      setPushToken(token); 
    })();
  }, []);

  const ensurePermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      return res.status === "granted";
    }
    return true;
  };

  const compute9AMReminder = (dueISO, daysBefore = 1) => {
    try {
      const due = new Date(dueISO);
      const t = new Date(due.getTime() - (daysBefore || 0) * 86400000);
      t.setHours(9, 0, 0, 0);
      if (t.getTime() <= Date.now()) return null;
      return t;
    } catch { return null; }
  };

  const scheduleAt = async ({ title, body, data, when }) => {
    if (!isEnabled) return null;
    if (!(await ensurePermission())) return null;
    if (!when) return null;
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: null },
      trigger:
        Platform.OS === "android"
          ? { channelId: "payments", date: when }
          : when,
    });
  };

  const notifyNow = async ({ title, body, data }) => {
    if (!isEnabled) return null;
    if (!(await ensurePermission())) return null;
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: null },
      trigger: null,
    });
  };

  const cancelReminder = async (id) => {
    if (!id) return;
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  };
  const cancelAllReminders = async () => {
    try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
  };

  useEffect(() => {
    (async () => {
      if (!isEnabled) {
        await cancelAllReminders();
        setPlanned((prev) => prev.map((p) => ({ ...p, notificationId: undefined })));
        return;
      }

      if (!prefs.planned) return;

      const next = [];
      for (const p of planned) {
        if (p.enabled) {
          const trigger = compute9AMReminder(p.dueDate, p.remindBeforeDays ?? 1);
          const nid = await scheduleAt({
            title: "Upcoming payment",
            body: `${p.title || "Payment"} • LKR ${Number(p.amount || 0).toLocaleString()} • Due ${new Date(p.dueDate).toLocaleDateString()}`,
            data: { type: "planned", id: p.id },
            when: trigger,
          });
          next.push({ ...p, notificationId: nid || undefined });
        } else {
          next.push({ ...p, notificationId: undefined });
        }
      }
      setPlanned(next);
    })();
  }, [isEnabled, prefs.planned]);


  const addPlanned = async (payload) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const base = {
      id,
      title: "",
      amount: 0,
      dueDate: new Date().toISOString(),
      remindBeforeDays: 1,
      enabled: true,
      ...payload,
    };

    let notificationId;
    if (base.enabled && isEnabled && prefs.planned) {
      const trigger = compute9AMReminder(base.dueDate, base.remindBeforeDays ?? 1);
      notificationId = await scheduleAt({
        title: "Upcoming payment",
        body: `${base.title || "Payment"} • LKR ${Number(base.amount || 0).toLocaleString()} • Due ${new Date(base.dueDate).toLocaleDateString()}`,
        data: { type: "planned", id: base.id },
        when: trigger,
      });
    }

    const next = { ...base, notificationId };
    setPlanned((prev) => [next, ...prev]);
    return next.id;
  };

  const updatePlanned = async (id, patch) => {
    const next = [];
    for (const p of planned) {
      if (p.id !== id) { next.push(p); continue; }
      if (p.notificationId) await cancelReminder(p.notificationId);

      const merged = { ...p, ...patch };
      let notificationId;
      if (merged.enabled && isEnabled && prefs.planned) {
        const trigger = compute9AMReminder(merged.dueDate, merged.remindBeforeDays ?? 1);
        notificationId = await scheduleAt({
          title: "Upcoming payment",
          body: `${merged.title || "Payment"} • LKR ${Number(merged.amount || 0).toLocaleString()} • Due ${new Date(merged.dueDate).toLocaleDateString()}`,
          data: { type: "planned", id: merged.id },
          when: trigger,
        });
      }

      next.push({ ...merged, notificationId });
    }
    setPlanned(next);
  };

  const removePlanned = async (id) => {
    const found = planned.find((x) => x.id === id);
    if (found?.notificationId) await cancelReminder(found.notificationId);
    setPlanned((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleItem = async (id, enabled) => updatePlanned(id, { enabled });

  const notifyTransactionAdded = async (tx) => {
    if (!prefs.txAlerts) return;
    const amt = Number(tx.amount || 0);
    const positive = amt >= 0;
    const title = positive ? "Income added" : (tx.type === "Loan" ? "Loan recorded" : "Expense added");
    const body = [
      `LKR ${Math.abs(amt).toLocaleString()}`,
      tx.category ? `• ${tx.category}` : "",
      tx.title ? `• ${tx.title}` : "",
    ].filter(Boolean).join(" ");
    await notifyNow({ title, body, data: { type: "tx", id: tx.id } });
  };

  const scheduleLoanReminder = async (loanTx) => {
    if (!prefs.loanReminders) return null;
    if (!loanTx?.repayBy) return null;
    const daysBefore = loanTx.loanRemindBeforeDays ?? 1;
    const when = compute9AMReminder(loanTx.repayBy, daysBefore);
    if (!when) return null;
    return scheduleAt({
      title: "Loan due reminder",
      body: `${loanTx.loanType === "Given" ? "Receivable" : "Payable"} • LKR ${Math.abs(Number(loanTx.amount || 0)).toLocaleString()} • Due ${new Date(loanTx.repayBy).toLocaleDateString()}`,
      data: { type: "loan-reminder", id: loanTx.id },
      when,
    });
  };

  const value = useMemo(() => ({
    isEnabled, setIsEnabled,

    pushToken,
    prefs, setPrefs,
    planned, addPlanned, updatePlanned, removePlanned, toggleItem,
    notifyTransactionAdded,
    scheduleLoanReminder,
  }), [isEnabled, prefs, planned, pushToken]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
export { NotificationProvider };
export default NotificationProvider;
