import crypto from 'crypto';

/**
 * Generates a random secure activation code in format: PREFIX-XXXX-XXXX-XXXX
 * Example: ERR-89A1-24BF-9901
 */
export function generateActivationCodeString(prefix: string = 'ERR'): string {
  const bytes = crypto.randomBytes(6);
  const hex = bytes.toString('hex').toUpperCase();
  const part1 = hex.substring(0, 4);
  const part2 = hex.substring(4, 8);
  const part3 = hex.substring(8, 12);
  return `${prefix}-${part1}-${part2}-${part3}`;
}
