export interface Classroom {
  id: string;
  name: string;
  ageGroup: string;
  teacherName?: string;
}

export interface Student {
  id: string;
  name: string;
  classroomId: string;
  classroomName: string;
  photoUrl?: string;
  avatarColor?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

export type EngagementOption =
  | 'Fully engaged'
  | 'Mostly engaged'
  | 'Partly engaged'
  | 'Barely engaged'
  | 'Not observed';

export type ParticipationOption =
  | 'Initiated'
  | 'Joined voluntarily'
  | 'Joined when prompted'
  | 'Watched but did not participate'
  | 'Avoided / withdrew'
  | 'Not observed';

export type FollowingOption =
  | 'Followed independently'
  | 'Followed after prompting'
  | 'Needed repeated prompting'
  | 'Could not follow despite support'
  | 'Not observed';

export type ThinkingOption =
  | 'Responded appropriately'
  | 'Asked questions'
  | 'Tried independently'
  | 'Tried another way / explored'
  | 'Needed help'
  | 'Not observed';

export type SocialOption =
  | 'Expressed spontaneously'
  | 'Responded when spoken to'
  | 'Interacted with other children'
  | 'Shared / cooperated'
  | 'Helped another child'
  | 'Preferred independent play'
  | 'Had difficulty interacting'
  | 'Not observed';

export type StateOption =
  | 'Happy / enthusiastic'
  | 'Calm / comfortable'
  | 'Quiet / reserved'
  | 'Restless'
  | 'Frustrated / upset'
  | 'Sleepy / tired'
  | 'Needed reassurance'
  | 'Nothing unusual noticed';

export type InterestOption =
  | 'No particular interest noticed'
  | 'Noticeably greater interest'
  | 'Noticeably less interest'
  | 'Not observed';

export interface DailyObservation {
  id?: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
  engagement?: EngagementOption;
  participation?: ParticipationOption;
  following?: FollowingOption;
  thinking?: ThinkingOption[]; // can be multiple or single
  social?: SocialOption[]; // multi-select checkbox supported
  state?: StateOption[]; // mood / disposition can combine (e.g. Calm + Happy)
  interest?: InterestOption;
  interestDetail?: string; // If greater / less interest – in what?
  additionalObservation?: string; // Anything else worth remembering
  recordedAt: string;
  updatedAt: string;
  synced?: boolean;
}

export const ENGAGEMENT_OPTIONS: EngagementOption[] = [
  'Fully engaged',
  'Mostly engaged',
  'Partly engaged',
  'Barely engaged',
  'Not observed'
];

export const PARTICIPATION_OPTIONS: ParticipationOption[] = [
  'Initiated',
  'Joined voluntarily',
  'Joined when prompted',
  'Watched but did not participate',
  'Avoided / withdrew',
  'Not observed'
];

export const FOLLOWING_OPTIONS: FollowingOption[] = [
  'Followed independently',
  'Followed after prompting',
  'Needed repeated prompting',
  'Could not follow despite support',
  'Not observed'
];

export const THINKING_OPTIONS: ThinkingOption[] = [
  'Responded appropriately',
  'Asked questions',
  'Tried independently',
  'Tried another way / explored',
  'Needed help',
  'Not observed'
];

export const SOCIAL_OPTIONS: SocialOption[] = [
  'Expressed spontaneously',
  'Responded when spoken to',
  'Interacted with other children',
  'Shared / cooperated',
  'Helped another child',
  'Preferred independent play',
  'Had difficulty interacting',
  'Not observed'
];

export const STATE_OPTIONS: StateOption[] = [
  'Happy / enthusiastic',
  'Calm / comfortable',
  'Quiet / reserved',
  'Restless',
  'Frustrated / upset',
  'Sleepy / tired',
  'Needed reassurance',
  'Nothing unusual noticed'
];

export const INTEREST_OPTIONS: InterestOption[] = [
  'No particular interest noticed',
  'Noticeably greater interest',
  'Noticeably less interest',
  'Not observed'
];
