import type { PaginationParams } from "../types/Shared";

/**
 * Tập trung toàn bộ Query Keys để tránh typo và dễ invalidate.
 * Import từ: import { QUERY_KEYS } from "@/shared/constants/queryKeys"
 */
export const QUERY_KEYS = {
  // ───── Auth ─────
  currentUser: ["currentUser"] as const,

  // ───── Organizations ─────
  orgs: {
    all: ["orgs"] as const,
    list: (params?: PaginationParams) => ["orgs", "list", params] as const,
    detail: (id: string) => ["orgs", "detail", id] as const,
    trash: ["orgs", "trash"] as const,
    properties: (id: string) => ["orgs", id, "properties"] as const,
    users: (id: string) => ["orgs", id, "users"] as const,
    services: (id: string) => ["orgs", id, "services"] as const,
  },

  // ───── Properties ─────
  properties: {
    all: ["properties"] as const,
    list: (params?: PaginationParams) => ["properties", "list", params] as const,
    detail: (id: string) => ["properties", "detail", id] as const,
    trash: ["properties", "trash"] as const,
  },

  // ───── Floors ─────
  floors: {
    all: ["floors"] as const,
    list: (params?: PaginationParams) => ["floors", "list", params] as const,
    byProperty: (propertyId: string) =>
      ["floors", "byProperty", propertyId] as const,
    detail: (id: string) => ["floors", "detail", id] as const,
    trash: ["floors", "trash"] as const,
  },

  // ───── Rooms ─────
  rooms: {
    all: ["rooms"] as const,
    list: (params?: PaginationParams) => ["rooms", "list", params] as const,
    byProperty: (propertyId: string) =>
      ["rooms", "byProperty", propertyId] as const,
    detail: (id: string) => ["rooms", "detail", id] as const,
    trash: ["rooms", "trash"] as const,
  },

  // ───── Meters ─────
  meters: {
    all: ["meters"] as const,
    list: (params?: PaginationParams) => ["meters", "list", params] as const,
    byProperty: (propertyId: string) =>
      ["meters", "byProperty", propertyId] as const,
    byFloor: (propertyId: string, floorId: string) =>
      ["meters", "byFloor", propertyId, floorId] as const,
    detail: (id: string) => ["meters", "detail", id] as const,
    readings: (meterId: string) => ["meters", meterId, "readings"] as const,
    readingDetail: (meterId: string, readingId: string) =>
      ["meters", meterId, "readings", readingId] as const,
    adjustments: (readingId: string) =>
      ["meters", "readings", readingId, "adjustments"] as const,
  },

  // ───── Services ─────
  services: {
    all: ["services"] as const,
    list: (params?: PaginationParams) => ["services", "list", params] as const,
    detail: (id: string) => ["services", "detail", id] as const,
    trash: ["services", "trash"] as const,
  },

  // ───── Contracts ─────
  contracts: {
    all: ["contracts"] as const,
    list: (params?: PaginationParams) =>
      ["contracts", "list", params] as const,
    detail: (id: string) => ["contracts", "detail", id] as const,
    trash: ["contracts", "trash"] as const,
    members: (contractId: string) =>
      ["contracts", contractId, "members"] as const,
    pending: ["contracts", "pending"] as const,
  },

  // ───── Invoices ─────
  invoices: {
    all: ["invoices"] as const,
    list: (params?: PaginationParams) => ["invoices", "list", params] as const,
    byProperty: (propertyId: string) =>
      ["invoices", "byProperty", propertyId] as const,
    detail: (id: string) => ["invoices", "detail", id] as const,
    trash: ["invoices", "trash"] as const,
  },

  // ───── Handovers ─────
  handovers: {
    all: ["handovers"] as const,
    list: (params?: PaginationParams) =>
      ["handovers", "list", params] as const,
    detail: (id: string) => ["handovers", "detail", id] as const,
    items: (handoverId: string) => ["handovers", handoverId, "items"] as const,
    snapshots: (handoverId: string) =>
      ["handovers", handoverId, "snapshots"] as const,
  },

  // ───── Users ─────
  users: {
    all: ["users"] as const,
    list: (params?: PaginationParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    trash: ["users", "trash"] as const,
  },

  // ───── Profile ─────
  profile: {
    me: ["profile", "me"] as const,
    mfaStatus: ["profile", "mfaStatus"] as const,
  },

  // ───── Audit Logs ─────
  auditLogs: {
    all: ["auditLogs"] as const,
    list: (params?: Record<string, any>) =>
      ["auditLogs", "list", params] as const,
    detail: (id: string) => ["auditLogs", "detail", id] as const,
  },
} as const;
