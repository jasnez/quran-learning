"use server";

import { getServerUser } from "@/lib/auth/serverAuth";
import { getSupabaseClient } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Updates the current user's display_name in user_profiles.
 */
export async function updateDisplayNameAction(
  displayName: string
): Promise<{ error: string | null }> {
  const user = await getServerUser();
  if (!user) {
    return { error: "Nisi prijavljen." };
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName.trim() || null })
    .eq("id", user.id);
  if (error) {
    return { error: error.message ?? "Ne možemo spremiti ime." };
  }
  return { error: null };
}

/**
 * Uploads avatar to Storage, updates user_profiles.avatar_url, returns the new public URL.
 * FormData must contain a file under key "avatar" (image/jpeg, png, webp, gif; max 2 MB).
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<{ error: string | null; avatarUrl: string | null }> {
  const user = await getServerUser();
  if (!user) {
    return { error: "Nisi prijavljen.", avatarUrl: null };
  }
  const file = formData.get("avatar");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Odaberi sliku za avatar.", avatarUrl: null };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Dozvoljeni formati: JPEG, PNG, WebP, GIF.", avatarUrl: null };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Slika može imati najviše 2 MB.", avatarUrl: null };
  }
  const supabase = getSupabaseClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) {
    return { error: uploadError.message ?? "Upload nije uspio.", avatarUrl: null };
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (updateError) {
    return { error: updateError.message ?? "Ne možemo spremiti avatar.", avatarUrl: null };
  }
  return { error: null, avatarUrl: publicUrl };
}

/**
 * Deletes the current user's data and auth account.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
 * Returns { error: null } on success, or { error: "message" } on failure.
 */
export async function deleteAccountAction(): Promise<{ error: string | null }> {
  const user = await getServerUser();
  if (!user) {
    return { error: "Nisi prijavljen." };
  }

  const userId = user.id;
  const supabase = getSupabaseClient();

  try {
    await supabase.from("user_progress").delete().eq("user_id", userId);
    await supabase.from("user_bookmarks").delete().eq("user_id", userId);
    await supabase.from("user_settings").delete().eq("id", userId);
    await supabase.from("user_profiles").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return { error: error.message ?? "Ne možemo obrisati račun. Pokušaj ponovo." };
    }
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ne možemo obrisati račun.";
    return { error: message };
  }
}
