import React, { createContext, useContext } from 'react';

const CurrencyContext = createContext();

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_SYMBOL = '₹';

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export function CurrencyProvider({ children }) {
  const value = {
    currency: DEFAULT_CURRENCY,
    symbol: DEFAULT_SYMBOL,
    currencies,
    changeCurrency: () => {},
    convert: (amount) => amount,
    format: (amount) => `${DEFAULT_SYMBOL}${Number(amount || 0).toLocaleString('en-IN')}`,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
