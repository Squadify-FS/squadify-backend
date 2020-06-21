export interface INewMessageInterface {
  userId: string;
  groupId: string;
  chatId: string;
  text: string;
  imageUrl?: string;
}


export interface INewGroupInterface {
  name: string;
  isPrivate: boolean;
  creatorId: string;
  friendIds?: string[];
  followersReadOnly?: boolean;
  avatarUrl: string;
}

export interface IUserGroupIds {
  userId: string;
  groupId: string;
}
