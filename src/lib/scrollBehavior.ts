/** "auto" (instant) when the user asks for reduced motion, else "smooth". */
export function preferredScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "auto";
  }
  return "smooth";
}
