// Shared client-side types mirroring the API's JSON shapes (see src/lib/serialize.ts
// and src/app/api/{applications,stages}/route.ts for the server side of this contract).

export type Note = { date: string; text: string };

export type Application = {
  id: string;
  userId: string;
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
