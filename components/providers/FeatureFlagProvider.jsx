"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bazaarx_experiments";

/**
 * Experiment definitions. `variants` are weighted equally; add an experiment
 * here and it is allocated on first visit and then held stable.
 */
const EXPERIMENTS = {
  checkoutLayout: { variants: ["control", "single_step"] },
  pdpGalleryStyle: { variants: ["control", "spin_first"] },
};

/** Static flags (not experiments) — safe to flip without reallocating anyone. */
const STATIC_FLAGS = {
  showVernacularSearch: true,
  enableArView: false,
};

const FeatureFlagContext = createContext({ flags: STATIC_FLAGS, variants: {}, assignmentId: null });

/**
 * Deterministic bucketing: the variant is derived by hashing
 * `assignmentId + experiment`, so a visitor sees the same variant on every
 * page and across reloads. The previous implementation re-rolled
 * `Math.random()` inside useEffect on every mount, which meant a single user
 * flipped variants while browsing and made results meaningless.
 */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function allocate(assignmentId) {
  const variants = {};
  for (const [name, def] of Object.entries(EXPERIMENTS)) {
    variants[name] = def.variants[hash(`${assignmentId}:${name}`) % def.variants.length];
  }
  return variants;
}

export function FeatureFlagProvider({ children }) {
  const [assignmentId, setAssignmentId] = useState(null);

  useEffect(() => {
    let id;
    try {
      id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = (crypto?.randomUUID?.() || String(Date.now() + Math.random()));
        localStorage.setItem(STORAGE_KEY, id);
      }
    } catch {
      id = "anonymous"; // private mode / storage blocked
    }
    setAssignmentId(id);
  }, []);

  const value = useMemo(() => ({
    flags: STATIC_FLAGS,
    // Before hydration everyone sees control, so SSR and first paint agree.
    variants: assignmentId ? allocate(assignmentId) : Object.fromEntries(
      Object.entries(EXPERIMENTS).map(([k, v]) => [k, v.variants[0]])
    ),
    assignmentId,
  }), [assignmentId]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}

/** Returns the assigned variant for one experiment. */
export function useVariant(name) {
  const { variants } = useContext(FeatureFlagContext);
  return variants[name] ?? "control";
}
