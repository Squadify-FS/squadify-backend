export interface INewEventDetails {
  userId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  isPrivate: boolean;
}

export interface IUpdateEventDetails {
  userId: string;
  eventId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  isPrivate?: boolean;
}

export interface IUserEvent {
  userId: string;
  eventId: string;
}

export interface IUserEventGroup {
  userId: string;
  eventId: string;
  groupId: string;
}

export interface IUserEventInviter {
  userId: string;
  eventId: string;
  inviterId?: string;
}

export interface IEventHashtag {
  hashtagId: string;
  eventId: string;
}