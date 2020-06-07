export type GroupPermissionLevelKey = keyof typeof GroupPermissionLevelEnum;

export enum GroupPermissionLevelEnum {
  'User' = 0,
  'Admin' = 1,
}
