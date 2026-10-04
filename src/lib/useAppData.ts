"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Application, AssignmentSlot, Note, PipelineStage } from "./app-types";
import { apiError, CV_ACCEPT, pickFiles, uploadFile } from "./uploads";

export type NewApplicationInput = {
  company: string;
  title: string;
  link?: string;
  date?: string;
  desc?: string;
  referral?: boolean;
  cvName?: string;
  cvFileId?: string;
};

export type ApplicationPatch = Partial<{
  company: string;
  role: string;
  source: string;
  cvVersion: string | null;
  cvFileName: string | null;
  cvFileId: string | null;
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
  appendNote: { date?: string; text: string; stage?: string };
  removeNoteIndex: number;
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

  /** Swap in the refreshed application the file/email endpoints respond with. */
  const applyServerApp = useCallback((app: Application) => {
    setApps((prev) => (prev ? prev.map((a) => (a.id === app.id ? app : a)) : prev));
    return app;
  }, []);

  const sendForApp = useCallback(
    async (url: string, init: RequestInit, fallback: string) => {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(await apiError(res, fallback));
      return applyServerApp((await res.json()).application as Application);
    },
    [applyServerApp],
  );

  /** Upload a CV file and attach it to an application (replacing any current one). */
  const attachCv = useCallback(
    async (appId: string, file: File) => {
      const meta = await uploadFile(file);
      return patchApp(appId, { cvFileId: meta.id });
    },
    [patchApp],
  );

  /** Open the file picker, then attach the chosen CV. Surfaces upload errors to the user. */
  const pickAndAttachCv = useCallback(
    async (appId: string) => {
      const [file] = await pickFiles(CV_ACCEPT);
      if (!file) return;
      try {
        await attachCv(appId, file);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Couldn't attach that CV.");
      }
    },
    [attachCv],
  );

  /** Attach an email file (.eml/.msg/.pdf/image) to one stage of an application. */
  const attachEmailFile = useCallback(
    (appId: string, stage: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("stage", stage);
      return sendForApp(`/api/applications/${appId}/emails`, { method: "POST", body: form }, "Couldn't attach that email.");
    },
    [sendForApp],
  );

  /** Save pasted email text under one stage. */
  const attachEmailText = useCallback(
    (appId: string, stage: string, text: string) =>
      sendForApp(`/api/applications/${appId}/emails`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage, text }) }, "Couldn't save that email."),
    [sendForApp],
  );

  const removeEmail = useCallback(
    (appId: string, emailId: string) => sendForApp(`/api/applications/${appId}/emails/${emailId}`, { method: "DELETE" }, "Couldn't remove that email."),
    [sendForApp],
  );

  const addAssignmentFile = useCallback(
    (appId: string, slot: AssignmentSlot, file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("slot", slot);
      return sendForApp(`/api/applications/${appId}/assignment-files`, { method: "POST", body: form }, "Couldn't upload that file.");
    },
    [sendForApp],
  );

  const removeAssignmentFile = useCallback(
    (appId: string, rowId: string) => sendForApp(`/api/applications/${appId}/assignment-files/${rowId}`, { method: "DELETE" }, "Couldn't remove that file."),
    [sendForApp],
  );

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

  return { apps, stages, loading, error, refresh, createApp, patchApp, deleteApp, createStage, attachCv, pickAndAttachCv, attachEmailFile, attachEmailText, removeEmail, addAssignmentFile, removeAssignmentFile };
}
