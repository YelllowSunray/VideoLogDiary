"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, type UserProfile } from "@/lib/profile";

interface ProfileContextValue {
  profile: UserProfile | null;
  reloadProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    load();
  }, [user, load]);

  return (
    <ProfileContext.Provider value={{ profile, reloadProfile: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
