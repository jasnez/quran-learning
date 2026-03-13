import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deleteAccountAction,
  updateDisplayNameAction,
  uploadAvatarAction,
} from "../actions";

const getServerUserMock = vi.hoisted(() => vi.fn());
const getSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/serverAuth", () => ({ getServerUser: getServerUserMock }));
vi.mock("@/lib/supabase", () => ({ getSupabaseClient: getSupabaseClientMock }));

const baseSupabaseMock = () => ({
  from: (table: string) => ({
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    upsert: () => Promise.resolve({ error: null }),
  }),
  auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
  storage: {
    from: () => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.example.com/avatars/${path}` } }),
    }),
  },
});

describe("deleteAccountAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    getServerUserMock.mockResolvedValueOnce(null);

    const result = await deleteAccountAction();

    expect(result.error).toBeTruthy();
    expect(result.error).toMatch(/nisi prijavljen|not authenticated/i);
    expect(getSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("deletes user data and auth user when authenticated", async () => {
    const userId = "user-123";
    getServerUserMock.mockResolvedValueOnce({ id: userId, email: "u@x.com" });

    const deleteUserMock = vi.fn().mockResolvedValue({ error: null });
    getSupabaseClientMock.mockReturnValue({
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
      auth: { admin: { deleteUser: deleteUserMock } },
    });

    const result = await deleteAccountAction();

    expect(result.error).toBeNull();
    expect(deleteUserMock).toHaveBeenCalledWith(userId);
  });

  it("returns error when admin deleteUser fails", async () => {
    getServerUserMock.mockResolvedValueOnce({ id: "user-1", email: "u@x.com" });
    getSupabaseClientMock.mockReturnValue({
      from: () => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({
            error: new Error("Cannot delete user"),
          }),
        },
      },
    });

    const result = await deleteAccountAction();

    expect(result.error).toBeTruthy();
    expect(result.error).toMatch(/cannot delete|ne možemo|obrisati/i);
  });
});

describe("updateDisplayNameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    getServerUserMock.mockResolvedValueOnce(null);

    const result = await updateDisplayNameAction("New Name");

    expect(result.error).toBeTruthy();
    expect(getSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("updates user_profiles display_name when authenticated", async () => {
    const userId = "user-456";
    getServerUserMock.mockResolvedValueOnce({ id: userId });
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    getSupabaseClientMock.mockReturnValue({
      ...baseSupabaseMock(),
      from: (table: string) =>
        table === "user_profiles"
          ? { update: updateMock }
          : baseSupabaseMock().from(table),
    });

    const result = await updateDisplayNameAction("Moje Ime");

    expect(result.error).toBeNull();
    expect(updateMock).toHaveBeenCalledWith({ display_name: "Moje Ime" });
  });
});

describe("uploadAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    getServerUserMock.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.set("avatar", new File(["x"], "pic.png", { type: "image/png" }));

    const result = await uploadAvatarAction(formData);

    expect(result.error).toBeTruthy();
    expect(result.avatarUrl).toBeNull();
  });

  it("returns error when no file in formData", async () => {
    getServerUserMock.mockResolvedValueOnce({ id: "user-1" });
    getSupabaseClientMock.mockReturnValue(baseSupabaseMock());

    const result = await uploadAvatarAction(new FormData());

    expect(result.error).toMatch(/odaberi sliku|no file|file/i);
    expect(result.avatarUrl).toBeNull();
  });

  it("uploads file and returns public avatar URL when authenticated", async () => {
    const userId = "user-789";
    getServerUserMock.mockResolvedValueOnce({ id: userId });
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    getSupabaseClientMock.mockReturnValue({
      ...baseSupabaseMock(),
      from: (table: string) =>
        table === "user_profiles"
          ? {
              update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            }
          : baseSupabaseMock().from(table),
      storage: {
        from: () => ({
          upload: uploadMock,
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } }),
        }),
      },
    });

    const formData = new FormData();
    formData.set("avatar", new File(["content"], "photo.png", { type: "image/png" }));

    const result = await uploadAvatarAction(formData);

    expect(result.error).toBeNull();
    expect(result.avatarUrl).toBeTruthy();
    expect(uploadMock).toHaveBeenCalled();
  });
});
