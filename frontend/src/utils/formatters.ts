import { ethers } from "ethers";

// Format address for display
export const formatAddress = (
  address: string,
  prefix: number = 6,
  suffix: number = 4
): string => {
  if (!address) return "";
  if (address.length < prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
};

// Format balance for display
export const formatBalance = (
  balance: string,
  decimals: number = 18,
  displayDecimals: number = 4
): string => {
  try {
    const parsed = ethers.formatUnits(balance, decimals);
    const number = parseFloat(parsed);

    // For very small numbers, show scientific notation
    if (number > 0 && number < 0.0001) {
      return number.toExponential(2);
    }

    // For zero or regular numbers
    return number.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    });
  } catch (error) {
    // If there's an error parsing, just return the original string
    try {
      const number = parseFloat(balance);
      return number.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: displayDecimals,
      });
    } catch (innerError) {
      return balance;
    }
  }
};

// Format currency for display
export const formatCurrency = (
  value: number | string,
  currency: string = "USD",
  digits: number = 2
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: numValue >= 1 ? digits : 2,
    maximumFractionDigits: numValue >= 1 ? digits : 6,
  }).format(numValue);
};

// Format percentage for display
export const formatPercentage = (
  value: number | string,
  digits: number = 2
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numValue / 100);
};

// Format date for display
export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format gas price
export const formatGasPrice = (gasPrice: string | number): string => {
  try {
    const gweiValue = ethers.formatUnits(gasPrice.toString(), "gwei");
    return `${parseFloat(gweiValue).toFixed(2)} Gwei`;
  } catch (error) {
    return `${gasPrice} Gwei`;
  }
};

// Parse input amount with validation
export const parseInputAmount = (
  value: string,
  decimals: number = 18
): string => {
  try {
    return ethers.parseUnits(value, decimals).toString();
  } catch (error) {
    return "0";
  }
};
