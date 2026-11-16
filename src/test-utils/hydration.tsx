import type { ReactElement } from "react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { vi } from "vitest";

/**
 * Simulates what happens to a statically exported page: renders `ui` to HTML
 * the way `next build` does (server snapshots of external stores), then
 * hydrates that HTML on the "client" and collects every hydration error React
 * reports. Must run in a jsdom test environment.
 *
 * `beforeHydrate` runs between the two phases, e.g. to move the system clock.
 * Zustand stores need no special setup: on the server pass React uses
 * `getInitialState()`, so any state set with `setState` before calling this
 * helper only exists on the client, like data from localStorage.
 */
export async function collectHydrationErrors(
  ui: ReactElement,
  { beforeHydrate }: { beforeHydrate?: () => void } = {},
): Promise<string[]> {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const html = renderToString(ui);
  beforeHydrate?.();

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  const errors: string[] = [];
  const consoleError = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(" "));
  });
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, ui, {
        onRecoverableError: (error) => {
          errors.push(error instanceof Error ? error.message : String(error));
        },
      });
    });
  } finally {
    consoleError.mockRestore();
    act(() => root?.unmount());
    container.remove();
  }
  // Returned unfiltered on purpose: a filter could silently drop a real
  // hydration error whose wording changed in a React upgrade.
  return errors;
}
