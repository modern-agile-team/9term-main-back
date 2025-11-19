export enum S3ObjectType {
  PROFILE = 'PROFILE',
  GROUP = 'GROUP',
  POST = 'POST',
  GROUP_BANNER = 'GROUP_BANNER',
}

export type UploadContext =
  | { type: S3ObjectType.GROUP; groupId: number }
  | { type: S3ObjectType.POST; groupId: number; postId?: number }
  | { type: S3ObjectType.PROFILE; userId: number }
  | { type: S3ObjectType.GROUP_BANNER; groupId: number };
