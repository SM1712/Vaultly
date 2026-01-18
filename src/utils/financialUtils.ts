/**
 * Financial Utilities
 * 
 * Handles all monetary calculations using integer cents to avoid floating-point errors.
 * Example: $10.50 -> 1050 cents.
 */

/**
 * Converts a decimal amount (e.g., 10.50) to integer cents (1050).
 * Handles floating point artifacts like 10.500000001 -> 1050.
 */
export const toCents = (amount: number): number => {
    return Math.round(amount * 100);
};

/**
 * Converts integer cents (e.g., 1050) back to decimal amount (10.50).
 */
export const fromCents = (cents: number): number => {
    return cents / 100;
};

/**
 * Adds two decimal amounts safely.
 */
export const safeAdd = (a: number, b: number): number => {
    return fromCents(toCents(a) + toCents(b));
};

/**
 * Subtracts b from a safely.
 */
export const safeSub = (a: number, b: number): number => {
    return fromCents(toCents(a) - toCents(b));
};

/**
 * Multiplies a decimal amount by a factor safely.
 */
export const safeMul = (amount: number, factor: number): number => {
    return fromCents(Math.round(toCents(amount) * factor));
};

/**
 * Divides an amount safely.
 */
export const safeDiv = (amount: number, divisor: number): number => {
    if (divisor === 0) return 0;
    return fromCents(Math.round(toCents(amount) / divisor));
};

/**
 * Formats a decimal amount to a currency string.
 * @param amount The decimal amount (e.g., 1050.50)
 * @param symbol The currency symbol (e.g., "$", "€")
 */
export const formatCurrency = (amount: number, symbol: string = '$'): string => {
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calculates a percentage of an amount safely.
 * @param amount The base amount
 * @param percentage The percentage (e.g., 15 for 15%)
 */
export const safePercent = (amount: number, percentage: number): number => {
    return fromCents(Math.round((toCents(amount) * percentage) / 100));
};
