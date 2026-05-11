export type ObjectIdString = string;
export type TenantKey = "Focelda" | "IOT" | string;

export type GroupStatus = "ACTIVE" | "DISABLED";
export type GroupKind = "ORG_UNIT" | "TEAM" | "ROLE_GROUP" | "CAPABILITY_GROUP";
export type PrincipalType = "GROUP" | "USER";
export type GrantEffect = "ALLOW" | "DENY";
export type ResourceType = "GROUP" | "PANEL" | "ACTION" | "DATA_SCOPE";
export type ScopeKind = "GLOBAL" | "ORG_UNIT" | "BUYER_CODE" | "AGENT_CODE" | "FAMIGLIA" | "LINEA" | "GRUPPO" | "QUOTATION_ID" | "LOOK_ID";

export interface CanvasPoint {
  x: number;
  y: number;
}

export type BuilderCanvasWorkspaceType = "access" | "route" | "config";

export interface BuilderCanvasNodeLayout {
  position: CanvasPoint;
  updatedAt?: string | null;
  updatedBy?: ObjectIdString | null;
}

export interface BuilderCanvasWorkspaceLayout {
  nodes: Record<ObjectIdString, BuilderCanvasNodeLayout>;
  updatedAt?: string | null;
  updatedBy?: ObjectIdString | null;
}

export interface BuilderEngineCanvasLayout {
  workspaces: Partial<Record<BuilderCanvasWorkspaceType, BuilderCanvasWorkspaceLayout>>;
}

export interface BuilderEngineMeta {
  revision: string;
  updatedAt?: string | null;
  updatedBy?: ObjectIdString | null;
  lastChange?: {
    action: string;
    label?: string;
    actorUserId?: ObjectIdString | null;
    createdAt?: string | null;
    changesCount?: number;
    workspace?: BuilderCanvasWorkspaceType;
  } | null;
  canvas?: BuilderEngineCanvasLayout;
}

export interface AccessBuilderMeta {
  revision: string;
  updatedAt?: string | null;
  updatedBy?: ObjectIdString | null;
  lastChange?: {
    action: string;
    label?: string;
    actorUserId?: ObjectIdString | null;
    createdAt?: string | null;
    changesCount?: number;
  } | null;
}

export interface AccessBuilderCanvasLayout {
  /** @deprecated Use builderEngine.canvas.workspaces.access.nodes. */
  positions: Record<ObjectIdString, CanvasPoint>;
  /** @deprecated Use builderEngine.canvas.workspaces.route.nodes. */
  navigationPositions?: Record<ObjectIdString, CanvasPoint>;
  /** @deprecated Use builderEngine.canvas.workspaces.config.nodes. */
  configPositions?: Record<ObjectIdString, CanvasPoint>;
  updatedAt?: string | null;
  updatedBy?: ObjectIdString | null;
  navigationUpdatedAt?: string | null;
  navigationUpdatedBy?: ObjectIdString | null;
  configUpdatedAt?: string | null;
  configUpdatedBy?: ObjectIdString | null;
}

export interface RoleOption {
  id: number;
  name: string;
  description?: string;
}

export interface UserSummary {
  _id: ObjectIdString;
  nome?: string;
  cognome?: string;
  username: string;
  ruolo?: number | string | string[];
  desc_role?: string | string[];
  multiRuolo?: number[] | string[];
  disabilitato?: boolean;
  immagini?: {
    avatar?: string | null;
    cover?: string | null;
  };
}


export interface UserDetailsRecord {
  _id: ObjectIdString;
  recapiti?: {
    cellulare?: string | null;
    interno?: string | null;
    fissoSede?: string | null;
  };
  sede?: string | null;
  divisione?: string | null;
  bu?: string | null;
  funzione?: string | null;
  divGeo?: string | null;
  biografia?: string | null;
  immagini?: {
    cover?: string | null;
    avatar?: string | null;
  };
}

export interface UserProfile {
  _id: ObjectIdString;
  username: string;
  nome: string;
  cognome: string;
  ruolo: number;
  multiRuolo: number[];
  isMEPA?: boolean;
  stato?: {
    ultimoAccesso?: string | null;
    codice?: string | number | null;
  };
  registrato?: string | null;
  codici?: {
    agente?: string | string[] | null;
    buyer?: string | string[] | null;
    ulterioriAgente?: string[];
  };
  magazzino?: string | null;
  disabilitato?: boolean;
  details: UserDetailsRecord;
}

export interface UserProfilePatch {
  username?: string;
  nome?: string;
  cognome?: string;
  ruolo?: number;
  multiRuolo?: number[];
  isMEPA?: boolean;
  codici?: {
    agente?: string | null;
    buyer?: string | null;
    ulterioriAgente?: string[];
  };
  magazzino?: string | null;
  disabilitato?: boolean;
  details?: Partial<Omit<UserDetailsRecord, "_id">>;
}

export interface UserCreatePayload extends UserProfilePatch {
  username: string;
  nome: string;
  cognome: string;
  password: string;
  ruolo: number;
  multiRuolo?: number[];
}

export interface AccessGroup {
  _id: ObjectIdString;
  tenant: TenantKey;
  key: string;
  name: string;
  description?: string;
  status: GroupStatus;
  kind: GroupKind;
  managerUserId?: ObjectIdString | null;
  parentGroupIds?: ObjectIdString[];
  membersCount?: number;
  grantsCount?: number;
  inheritedGrantsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupEdge {
  _id: ObjectIdString;
  tenant: TenantKey;
  parentGroupId: ObjectIdString;
  childType: "GROUP";
  childGroupId: ObjectIdString;
}

export interface GroupMembership {
  _id: ObjectIdString;
  tenant: TenantKey;
  groupId: ObjectIdString;
  userId: ObjectIdString;
  expiresAt?: string | null;
  note?: string;
  user?: UserSummary;
}

export interface PermissionScope {
  kind: ScopeKind;
  value?: string | null;
}

export interface PermissionGrant {
  _id: ObjectIdString;
  tenant: TenantKey;
  principalType: PrincipalType;
  principalId: ObjectIdString;
  permission: string;
  effect: GrantEffect;
  scope: PermissionScope;
  /**
   * Legacy optional condition. New group/panel/action grants created by Access Builder
   * are intentionally role-agnostic and should not set actorRoles by default.
   */
  context?: {
    actorRoles?: number[];
  };
  createdBy?: ObjectIdString | null;
  expiresAt?: string | null;
  source?: "DIRECT" | "INHERITED" | "USER_OVERRIDE";
  sourceGroupId?: ObjectIdString;
}

export interface NavigationResource {
  _id: ObjectIdString;
  tenant: TenantKey;
  appId: "legacy" | "shell" | string;
  key: string;
  type: ResourceType;
  name: string;
  route?: string;
  parentKey?: string | null;
  permission: string;
  order?: number;
  status: "ACTIVE" | "DISABLED";
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NavigationResourcePatch {
  appId?: string;
  key?: string;
  type?: ResourceType;
  name?: string;
  route?: string;
  parentKey?: string | null;
  permission?: string;
  order?: number;
  status?: "ACTIVE" | "DISABLED";
  meta?: Record<string, unknown>;
}

export interface NavigationResourceCreatePayload extends NavigationResourcePatch {
  appId: string;
  key: string;
  type: ResourceType;
  name: string;
  permission: string;
}

export interface EffectiveAccessPreview {
  tenant: TenantKey;
  userId: ObjectIdString;
  actorRole: number;
  version: string;
  groups: Array<AccessGroup & { inherited?: boolean }>;
  caps: string[];
  panels: NavigationResource[];
  grants: PermissionGrant[];
  denied: Array<{ permission: string; source: "GROUP" | "USER"; sourceId: ObjectIdString }>;
}

export interface AccessBuilderSnapshot {
  tenant: TenantKey;
  meta?: AccessBuilderMeta;
  builderEngine?: BuilderEngineMeta;
  canvasLayout?: AccessBuilderCanvasLayout;
  roles: RoleOption[];
  groups: AccessGroup[];
  edges: GroupEdge[];
  memberships: GroupMembership[];
  grants: PermissionGrant[];
  resources: NavigationResource[];
  users: UserSummary[];
  effectivePreview?: EffectiveAccessPreview;
}

export interface PendingChange {
  id: string;
  type:
    | "GROUP_CREATE"
    | "GROUP_UPDATE"
    | "EDGE_CREATE"
    | "EDGE_DELETE"
    | "MEMBERSHIP_ADD"
    | "MEMBERSHIP_REMOVE"
    | "GRANT_ADD"
    | "GRANT_REMOVE"
    | "CANVAS_LAYOUT_UPDATE"
    | "NAV_CANVAS_LAYOUT_UPDATE"
    | "BUILDER_CANVAS_LAYOUT_UPDATE"
    | "NAV_RESOURCE_CREATE"
    | "NAV_RESOURCE_UPDATE"
    | "NAV_RESOURCE_PARENT_SET"
    | "NAV_RESOURCE_DISABLE";
  label: string;
  payload: unknown;
  createdAt: string;
}
