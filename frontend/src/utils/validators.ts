import { ethers } from "ethers";

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Validate amount to ensure it's a valid number and greater than 0
export const isValidAmount = (amount: string): boolean => {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  } catch (error) {
    return false;
  }
};

// Get password strength score (0-4)
export const getPasswordStrength = (password: string): number => {
  let score = 0;

  // Length check
  if (password.length >= 8) score++;

  // Contains lowercase
  if (/[a-z]/.test(password)) score++;

  // Contains uppercase
  if (/[A-Z]/.test(password)) score++;

  // Contains number
  if (/[0-9]/.test(password)) score++;

  // Contains special character
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return Math.min(score, 4);
};

// Validate transaction amount against balance
export const isValidTransactionAmount = (
  amount: string,
  balance: string
): boolean => {
  try {
    const amountBN = ethers.parseEther(amount);
    const balanceBN = ethers.parseEther(balance);
    return amountBN <= balanceBN;
  } catch (error) {
    return false;
  }
};
