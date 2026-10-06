"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** false during SSR and the hydration pass, true afterwards. For UI that depends on localStorage (the cart). */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
