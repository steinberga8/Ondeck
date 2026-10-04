// Shared client-side types mirroring the API's JSON shapes (see src/lib/serialize.ts
// and src/app/api/{applications,stages}/route.ts for the server side of this contract).

/** Metadata for an uploaded file; bytes are fetched from /api/files/[id]. */
export type FileMeta = { id: string; name: string; mime: string; size: number; createdAt: string };

/** A note; `stage` ties it to one pipeline stage (older notes have none and show under every stage). */
export type Note = { date: string; text: string; stage?: string };

export type StageEmail = {
  id: string;
  stageKey: string;
  name: string;
  subject: string | null;
  sender: string | null;
  body: string | null;
  createdAt: string;
  file: FileMeta | null;
};

export type AssignmentSlot = "brief" | "submission";
export type AssignmentFile = { id: string; slot: AssignmentSlot; createdAt: string; file: FileMeta };

export type CvLibraryItem = { id: string; name: string; date: string; tag: string; fileId: string | null; file: FileMeta | null };

export type Application = {
  id: string;
  userId: string;
  company: string;
  role: string;
  source: string;
  cvVersion: string | null;
  cvFileName: string | null;
  cvFileId: string | null;
  cvFile: FileMeta | null;
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
  emails: StageEmail[];
  assignmentFiles: AssignmentFile[];
  createdAt: string;
  updatedAt: string;
};

export type PipelineStage = {
  id: string;
  userId: string;
  key: string;
  label: string;
  desc: string | null;
  color: string;
  soft: string;
  position: number;
  custom: boolean;
};
