export type GroupPermissionLevelKey = keyof typeof GroupPermissionLevelEnum;

export enum GroupPermissionLevelEnum {
  'Follower' = 0,
  'Friend' = 1,
  'Admin' = 2,
}

export type EventPermissionLevelKey = keyof typeof EventPermissionLevelEnum;

export enum EventPermissionLevelEnum {
  'Attendee' = 0,
  'Host' = 1,
  'Admin' = 2
}

