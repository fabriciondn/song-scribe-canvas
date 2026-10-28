export const LAUNCH_AMOUNT = 97;
// Only the commercial server price is authoritative, regardless of client input.
export function subscriptionAmount(_clientAmount?: unknown): number {
  return LAUNCH_AMOUNT;
}