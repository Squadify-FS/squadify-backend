export type PermissionLevelKey = keyof typeof PermissionLevelEnum;

export enum PermissionLevelEnum {
  'User' = 0,
  'Admin' = 2,
}
