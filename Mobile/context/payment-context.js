// Mobile/context/payment-context.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config"; // centralized import

const PaymentsContext = createContext();

export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const res = await fetch(`${BASE_URL}/api/transaction/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        } else {
          console.error("Failed to fetch payments. Status:", res.status);
        }
      } catch (error) {
        console.error("Error fetching payments:", error.message);
      }
    };

    fetchPayments();
  }, []);

  return (
    <PaymentsContext.Provider value={{ payments, setPayments }}>
      {children}
    </PaymentsContext.Provider>
  );
}

export const usePayments = () => useContext(PaymentsContext);
