/**
 * Removes invisible Unicode characters from a string.
 * This helps prevent issues when comparing strings that may contain hidden characters.
 * 
 * @param str The string to sanitize
 * @returns The sanitized string with invisible characters removed
 */
export function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';
  
  // Remove zero-width characters and other invisible Unicode characters
  // This regex targets various zero-width spaces, joiners, non-joiners, and other invisible characters
  return str.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\u0000-\u001F]/g, '');
}

/**
 * Checks if a string contains a substring, ignoring any invisible Unicode characters.
 * Useful for making comparisons when strings might have hidden characters.
 * 
 * @param str The string to check
 * @param substring The substring to look for
 * @returns True if the sanitized string contains the substring
 */
export function containsIgnoringUnicode(str: string | null | undefined, substring: string): boolean {
  if (!str) return false;
  return sanitizeString(str).includes(substring);
}

/**
 * Checks if two strings are equal, ignoring any invisible Unicode characters.
 * 
 * @param str1 The first string to compare
 * @param str2 The second string to compare
 * @returns True if the sanitized strings are equal
 */
export function equalsIgnoringUnicode(str1: string | null | undefined, str2: string | null | undefined): boolean {
  return sanitizeString(str1) === sanitizeString(str2);
}
