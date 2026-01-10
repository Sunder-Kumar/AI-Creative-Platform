"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const TrialContext = createContext();

const TRIAL_LIMIT = 10;

export function TrialProvider({ children }) {
  const [trialInfo, setTrialInfo] = useState({
    used: 0,
    remaining: 10,
    total: 10,
    active: true
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      // Reset trial info if no session
      setTrialInfo({ used: 0, remaining: TRIAL_LIMIT, total: TRIAL_LIMIT, active: true });
      setSubscriptionStatus("free");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_chats_used, trial_active")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      const used = profile.trial_chats_used ?? 0;
      const remaining = Math.max(0, TRIAL_LIMIT - used);
      const active = profile.subscription_status !== "active" && remaining > 0;

      setSubscriptionStatus(profile.subscription_status);
      setTrialInfo({
        used,
        remaining,
        total: TRIAL_LIMIT,
        active
      });
    } else {
      // If profile not found for session user, reset trial info
      setTrialInfo({ used: 0, remaining: TRIAL_LIMIT, total: TRIAL_LIMIT, active: true });
      setSubscriptionStatus("free");
    }
    setLoading(false);
  }, []); // Empty dependency array means this function is stable and won't change across renders

  useEffect(() => {
    loadProfile();
  }, [loadProfile]); // Add loadProfile to dependency array to satisfy ESLint and ensure it runs when needed

  // Used by ChatPage after generating response - now unused, will be removed
  // const updateTrialInfo = useCallback((info) => {
  //   setTrialInfo(prev => {
  //     const updated = {
  //       ...prev,
  //       ...info,
  //     };

  //     updated.total = updated.total ?? TRIAL_LIMIT;
  //     updated.used = updated.used ?? prev.used;
  //     updated.remaining = Math.max(0, updated.total - updated.used);
  //     updated.active = updated.remaining > 0;

  //     return updated;
  //   });
  // }, []);

  const refreshTrialInfo = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <TrialContext.Provider value={{
      trialInfo,
      refreshTrialInfo, // Expose refresh function
      subscriptionStatus,
      loading
    }}>
      {children}
    </TrialContext.Provider>
  );
}

export function useTrialContext() {
  return useContext(TrialContext);
}
