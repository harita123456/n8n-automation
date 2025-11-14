export interface MilestoneRow {
  // Basic fields (backward compatible)
  title: string;
  description?: string;
  dueDate?: string;
  owner?: string;
  priority?: string;
  status?: string;

  // Extended fields to support the provided sheet format
  milestoneName?: string; // alias of title when using "Milestone" column
  modules?: string; // long multiline text
  totalHours?: string | number;
  uiHours?: string | number;
  backendHours?: string | number;
  frontendHours?: string | number;
  adminHours?: string | number;
  days?: string | number;
  members?: string; // comma-separated names
  labels?: string; // comma-separated labels
}
