"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Application, Note, PipelineStage } from "./app-types";

export type NewApplicationInput = {
  company: string;
  title: string;
  link?: string;
  date?: string;
  desc?: string;
  referral?: boolean;
  cvName?: string;
};

export type ApplicationPatch = Partial<{
  company: string;
  role: string;
  source: string;
  cvVersion: string | null;
  cvFileName: string | null;
  link: string | null;
  appliedDate: string;
  stage: string;
  nextStep: string;
  desc: string | null;
  referral: boolean;
  rejected: boolean;
  rejectedAt: string | null;
  assignmentTitle: string | null;
  assignmentDesc: string | null;
  assignmentDue: string | null;
  jdKeywords: string[];
  notes: Note[];
  appendNote: { date?: string; text: string };
}>;

export type InitialAppData = { apps: Application[]; stages: PipelineStage[] };

/**
 * Fetches this user's applications + pipeline stages and exposes mutation helpers that talk
 * to the already-built /api/applications and /api/stages endpoints. Each page that needs this
 * data calls the hook independently — there's no cross-page cache, matching the "local state"
 * guidance for these screens.
 *
 * Pass `initial` (server-fetched via getUserAppsAndStages) to skip the client-side loading
 * flash — the page's Server Component fetches once, hands it to the Client Component as
 * props, and this hook seeds its state from that instead of re-fetching on mount.
 */
export function useAppData(initial?: InitialAppData) {
  const [apps, setApps] = useState<Application[] | null>(initial?.apps ?? null);
  const [stages, setStages] = useState<PipelineStage[] | null>(initial?.stages ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const hadInitial = useRef(!!initial);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, stagesRes] = await Promise.all([fetch("/api/applications"), fetch("/api/stages")]);
      if (!appsRes.ok || !stagesRes.ok) throw new Error("Failed to load applications.");
      const appsData = await appsRes.json();
      const stagesData = await stagesRes.json();
      setApps(appsData.applications);
      setStages(stagesData.stages);
      setError(null);
    } catch {
      setError("Couldn't load your applications. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hadInitial.current) refresh();
  }, [refresh]);

  const createApp = useCallback(async (input: NewApplicationInput) => {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create application.");
    const data = await res.json();
    setApps((prev) => (prev ? [data.application, ...prev] : [data.application]));
    return data.application as Application;
  }, []);

  const patchApp = useCallback(async (id: string, patch: ApplicationPatch) => {
    // Optimistic local update so drag/stage changes feel instant; reconciled below.
    setApps((prev) => (prev ? prev.map((a) => (a.id === id ? { ...a, ...(patch as Partial<Application>) } : a)) : prev));
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update application.");
    const data = await res.json();
    setApps((prev) => (prev ? prev.map((a) => (a.id === id ? data.application : a)) : prev));
    return data.application as Application;
  }, []);

  const deleteApp = useCallback(async (id: string) => {
    setApps((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete application.");
  }, []);

  const createStage = useCallback(async (input: { label: string; desc?: string; afterKey: string }) => {
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create stage.");
    const data = await res.json();
    setStages(data.stages);
    return data.stages as PipelineStage[];
  }, []);

  return { apps, stages, loading, error, refresh, createApp, patchApp, deleteApp, createStage };
}
