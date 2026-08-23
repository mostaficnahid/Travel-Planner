"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { WORLD_CURRENCIES, getLiveExchangeRates, convertCurrency, CurrencyInfo } from "@/lib/services/currency";

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  rates: Record<string, number>;
  isLive: boolean;
  convertAmount: (amount: number, fromCurr?: string) => number;
  formatAmount: (amount: number, fromCurr?: string) => string;
  getSymbol: (code?: string) => string;
  allCurrencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>("USD");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    // Load persisted currency preference
    const saved = localStorage.getItem("voyage_ai_currency");
    if (saved && WORLD_CURRENCIES.some((c) => c.code === saved)) {
      setSelectedCurrencyState(saved);
    }
  }, []);

  useEffect(() => {
    // Fetch live rates when selected currency changes
    getLiveExchangeRates(selectedCurrency).then((res) => {
      setRates(res.rates);
      setIsLive(res.isLive);
    });
  }, [selectedCurrency]);

  const setSelectedCurrency = (curr: string) => {
    setSelectedCurrencyState(curr);
    localStorage.setItem("voyage_ai_currency", curr);
  };

  const getSymbol = (code?: string): string => {
    const targetCode = code || selectedCurrency;
    const match = WORLD_CURRENCIES.find((c) => c.code === targetCode);
    return match ? match.symbol : targetCode;
  };

  const convertAmount = (amount: number, fromCurr: string = "USD"): number => {
    if (!amount || isNaN(amount)) return 0;
    return convertCurrency(amount, fromCurr, selectedCurrency, rates);
  };

  const formatAmount = (amount: number, fromCurr: string = "USD"): string => {
    const converted = convertAmount(amount, fromCurr);
    const symbol = getSymbol(selectedCurrency);
    return `${symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${selectedCurrency}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        rates,
        isLive,
        convertAmount,
        formatAmount,
        getSymbol,
        allCurrencies: WORLD_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
