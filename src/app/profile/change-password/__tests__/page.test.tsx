/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const serverAuthMocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
}));

const updatePasswordMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/serverAuth", () => serverAuthMocks);
vi.mock("@/lib/auth/authHelpers", () => ({
  updatePassword: (...args: unknown[]) => updatePasswordMock(...args),
}));

const redirect = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
  useRouter: () => ({ push }),
}));

import ChangePasswordPage from "../page";

const { getServerUser } = serverAuthMocks;

describe("Change password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockClear();
    updatePasswordMock.mockReset();
  });

  it("redirects to /auth/login when user is not authenticated", async () => {
    getServerUser.mockResolvedValueOnce(null);

    await ChangePasswordPage();

    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("renders change password form when authenticated", async () => {
    getServerUser.mockResolvedValueOnce({
      id: "user-1",
      email: "u@example.com",
    });

    const Page = await ChangePasswordPage();
    render(Page);

    expect(
      screen.getByRole("heading", { name: /promijeni lozinku/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/nova lozinka/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/potvrdi novu lozinku/i)
    ).toBeInTheDocument();
    const submitButtons = screen.getAllByRole("button", { name: /spremi novu lozinku/i });
    expect(submitButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error when passwords do not match", async () => {
    getServerUser.mockResolvedValueOnce({ id: "u1", email: "u@x.com" });
    const Page = await ChangePasswordPage();
    render(Page);

    const newPass = screen.getAllByLabelText(/nova lozinka/i)[0];
    const confirmPass = screen.getAllByLabelText(/potvrdi novu lozinku/i)[0];
    await userEvent.clear(newPass);
    await userEvent.clear(confirmPass);
    await userEvent.type(newPass, "newPass123");
    await userEvent.type(confirmPass, "different");
    const form = newPass.closest("form");
    expect(form).toBeTruthy();
    form?.requestSubmit();

    await waitFor(() => {
      expect(screen.getByText(/lozinke se ne podudaraju/i)).toBeInTheDocument();
    });
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it("shows error when new password is too short", async () => {
    getServerUser.mockResolvedValueOnce({ id: "u1", email: "u@x.com" });
    const Page = await ChangePasswordPage();
    render(Page);

    const newPass = screen.getAllByLabelText(/nova lozinka/i)[0];
    const confirmPass = screen.getAllByLabelText(/potvrdi novu lozinku/i)[0];
    await userEvent.clear(newPass);
    await userEvent.clear(confirmPass);
    await userEvent.type(newPass, "12345");
    await userEvent.type(confirmPass, "12345");
    newPass.closest("form")?.requestSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(/lozinka mora imati/i)
      ).toBeInTheDocument();
    });
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it("calls updatePassword and redirects to /profile on success", async () => {
    getServerUser.mockResolvedValueOnce({ id: "u1", email: "u@x.com" });
    updatePasswordMock.mockResolvedValueOnce({ error: null });

    const Page = await ChangePasswordPage();
    render(Page);

    const newPass = screen.getAllByLabelText(/nova lozinka/i)[0];
    const confirmPass = screen.getAllByLabelText(/potvrdi novu lozinku/i)[0];
    await userEvent.clear(newPass);
    await userEvent.clear(confirmPass);
    await userEvent.type(newPass, "newSecurePass123");
    await userEvent.type(confirmPass, "newSecurePass123");
    newPass.closest("form")?.requestSubmit();

    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith("newSecurePass123");
    });
    expect(push).toHaveBeenCalledWith("/profile");
  });

  it("shows error when updatePassword fails", async () => {
    getServerUser.mockResolvedValueOnce({ id: "u1", email: "u@x.com" });
    updatePasswordMock.mockResolvedValueOnce({
      error: new Error("Password is too weak"),
    });

    const Page = await ChangePasswordPage();
    render(Page);

    const newPass = screen.getAllByLabelText(/nova lozinka/i)[0];
    const confirmPass = screen.getAllByLabelText(/potvrdi novu lozinku/i)[0];
    await userEvent.clear(newPass);
    await userEvent.clear(confirmPass);
    await userEvent.type(newPass, "newPass123");
    await userEvent.type(confirmPass, "newPass123");
    newPass.closest("form")?.requestSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(/password is too weak|ne možemo|greška/i)
      ).toBeInTheDocument();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
