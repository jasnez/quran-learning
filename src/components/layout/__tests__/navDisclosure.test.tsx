/**
 * @vitest-environment jsdom
 *
 * QA section 5: the header and "Više" menus used role="menu" without the arrow keys that role
 * promises, and focus was lost on close. They are site navigation, so they are disclosures:
 * a button with aria-expanded and a list of links in the normal Tab order.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import { MobileNav } from "../MobileNav";
import { SettingsOpenProvider, useSettingsOpen } from "@/contexts/SettingsOpenContext";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSelectedLayoutSegment: () => null,
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/store/playerStore", () => {
  const state = { activeAudioSrc: null, isPlaying: false, resume: () => {}, pause: () => {} };
  return { usePlayerStore: (sel: (s: typeof state) => unknown) => sel(state) };
});

afterEach(() => cleanup());

function SettingsState() {
  const { isOpen } = useSettingsOpen();
  return <output data-testid="settings-state">{isOpen ? "open" : "closed"}</output>;
}

describe("Header navigation disclosures", () => {
  it.each([
    ["Učenje", /tedžvid lekcije/i],
    ["Kur'anske dove", /sve dove/i],
  ])("%s opens a plain list of links, not an ARIA menu", async (trigger, firstLink) => {
    const user = userEvent.setup();
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const button = screen.getByRole("button", { name: new RegExp(trigger, "i") });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-haspopup");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list", { name: new RegExp(trigger, "i") });
    expect(button).toHaveAttribute("aria-controls", list.id);
    expect(screen.getByRole("link", { name: firstLink })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("Escape closes the list and returns focus to its button", async () => {
    const user = userEvent.setup();
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    const button = screen.getByRole("button", { name: /učenje/i });
    await user.click(button);
    await user.tab();
    expect(screen.getByRole("link", { name: /tedžvid lekcije/i })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: /tedžvid lekcije/i })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("Tab moves through the links in order and closes the list when focus leaves it", async () => {
    const user = userEvent.setup();
    render(<SettingsOpenProvider><Header /></SettingsOpenProvider>);
    await user.click(screen.getByRole("button", { name: /učenje/i }));
    await user.tab();
    expect(screen.getByRole("link", { name: /tedžvid lekcije/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /allahova lijepa imena/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /harfovi i izgovor/i })).toHaveFocus();

    await user.tab();

    expect(screen.queryByRole("link", { name: /harfovi i izgovor/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kur'anske dove/i })).toHaveFocus();
  });
});

describe("Mobile \"Više\" disclosure", () => {
  it("Escape closes the list and returns focus to the Više button", async () => {
    const user = userEvent.setup();
    render(<SettingsOpenProvider><MobileNav /></SettingsOpenProvider>);
    const more = screen.getByRole("button", { name: /više opcija/i });
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(more).not.toHaveAttribute("aria-haspopup");
    await user.tab();
    // The first item: search, which a phone reading screen has nowhere else.
    expect(screen.getByRole("link", { name: /pretraga/i })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("list", { name: /više opcija/i })).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  // The list closes when settings open, so the item itself cannot get focus back; the dialog
  // returns focus to whatever had it when it opened, which must be the Više button.
  it("Postavke focuses the Više button before it opens the settings dialog", async () => {
    const user = userEvent.setup();
    render(
      <SettingsOpenProvider>
        <MobileNav />
        <SettingsState />
      </SettingsOpenProvider>
    );
    const more = screen.getByRole("button", { name: /više opcija/i });
    await user.click(more);
    await user.click(screen.getByRole("button", { name: /postavke/i }));

    expect(screen.getByTestId("settings-state")).toHaveTextContent("open");
    expect(screen.queryByRole("list", { name: /više opcija/i })).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });
});
