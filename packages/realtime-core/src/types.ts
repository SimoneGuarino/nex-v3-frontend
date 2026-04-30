import type { SharedSessionSnapshot } from "@nex/shared-platform";

export type RealtimeChannel = "user" | "chat" | "admin";

export type NotificationEventPayload = {
  _id?: string;
  Viewd?: boolean;
  [key: string]: unknown;
};

export type ChatViewedPayload = {
  idBlock: string;
  path: string;
};

export type ChatFileUploadedPayload = {
  idBlock: string;
  path: string;
  messageId: string;
};

export type ConnectionStatePayload = {
  channel: RealtimeChannel;
  connected: boolean;
};

export type RealtimeEvent =
  | { type: "session-changed"; payload: SharedSessionSnapshot | null }
  | { type: "connection-state"; payload: ConnectionStatePayload }
  | { type: "maintenance-status"; payload: { maintenanceMode: boolean; raw: unknown } }
  | { type: "users-online"; payload: unknown[] }
  | { type: "notification-batch"; payload: NotificationEventPayload[] }
  | { type: "notification-received"; payload: NotificationEventPayload }
  | { type: "chat-message"; payload: unknown }
  | { type: "chat-viewed"; payload: ChatViewedPayload }
  | { type: "chat-message-list"; payload: unknown[] }
  | { type: "chat-block-end"; payload: { idBlock: string } }
  | { type: "chat-file-uploaded"; payload: ChatFileUploadedPayload }
  | { type: "sblocco-ordini-unread"; payload: unknown }
  | { type: "sblocco-ordini-read"; payload: unknown }
  | { type: "user-banned-status-update"; payload: unknown };

export type RealtimeListener = (event: RealtimeEvent) => void;
