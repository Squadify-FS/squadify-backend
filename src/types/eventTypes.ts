interface INewEventDetails {
  userId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  isPrivate: boolean;
}

interface IUpdateEventDetails {
  userId: string;
  eventId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  isPrivate: boolean;
}

interface IUserEvent {
  userId: string;
  eventId: string;
}

interface IUserEventGroup {
  userId: string;
  eventId: string;
  groupId: string;
}

interface IUserEventInviter {
  userId: string;
  eventId: string;
  inviterId?: string;
}

interface IEventHashtag {
  hashtagId: string;
  eventId: string;
}