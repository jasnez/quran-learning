"use client";

import { useState, useRef } from "react";
import { updateDisplayNameAction, uploadAvatarAction } from "./actions";

type ProfileHeaderEditProps = {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  email: string;
  memberSince: string | null;
};

export function ProfileHeaderEdit({
  initialDisplayName,
  initialAvatarUrl,
  email,
  memberSince,
}: ProfileHeaderEditProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    setNameError(null);
    setNameLoading(true);
    const { error } = await updateDisplayNameAction(displayName);
    setNameLoading(false);
    if (error) {
      setNameError(error);
      return;
    }
    setIsEditingName(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarLoading(true);
    const formData = new FormData();
    formData.set("avatar", file);
    const { error, avatarUrl: newUrl } = await uploadAvatarAction(formData);
    setAvatarLoading(false);
    e.target.value = "";
    if (error) {
      setAvatarError(error);
      return;
    }
    if (newUrl) setAvatarUrl(newUrl);
  };

  const fallbackDisplayName =
    initialDisplayName || email?.split("@")[0] || "Korisnik";
  const currentName = displayName.trim() || fallbackDisplayName;

  return (
    <section className="mb-8 rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
        Tvoj profil
      </h1>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
              width={48}
              height={48}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
              {currentName.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100">
            <span className="text-xs font-medium text-white">
              {avatarLoading ? "Učitavanje…" : "Promijeni"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={avatarLoading}
              onChange={handleAvatarChange}
              aria-label="Promijeni avatar"
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-[var(--theme-border)] bg-white px-3 py-1.5 text-base text-stone-900 dark:bg-stone-900 dark:text-stone-50"
                placeholder="Ime za prikaz"
                disabled={nameLoading}
                aria-label="Ime za prikaz"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={nameLoading}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {nameLoading ? "Spremanje…" : "Spremi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisplayName(initialDisplayName);
                  setNameError(null);
                  setIsEditingName(false);
                }}
                disabled={nameLoading}
                className="rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400"
              >
                Odustani
              </button>
            </div>
          ) : (
            <p className="text-base font-medium text-stone-900 dark:text-stone-50">
              {currentName}
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="ml-2 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Uredi
              </button>
            </p>
          )}
          {nameError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {nameError}
            </p>
          )}
          {avatarError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {avatarError}
            </p>
          )}
          <p className="text-sm text-stone-500 dark:text-stone-400">{email}</p>
          {memberSince && (
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Član od {memberSince}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
