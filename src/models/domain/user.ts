import type { UserRole } from './enums';

export interface UserProfileProps {
  userId?: string;
  fullName: string;
  facultyId: string | null;
  academicProgram: string | null;
  interests: string[];
  avatarUrl: string | null;
  isAuthorizedOrganizer: boolean;
  habeasDataAcceptedAt: Date;
}

export class UserProfile {
  readonly userId?: string;
  readonly fullName: string;
  readonly facultyId: string | null;
  readonly academicProgram: string | null;
  readonly interests: string[];
  readonly avatarUrl: string | null;
  readonly isAuthorizedOrganizer: boolean;
  readonly habeasDataAcceptedAt: Date;

  constructor(props: UserProfileProps) {
    this.userId = props.userId;
    this.fullName = props.fullName;
    this.facultyId = props.facultyId;
    this.academicProgram = props.academicProgram;
    this.interests = [...props.interests];
    this.avatarUrl = props.avatarUrl;
    this.isAuthorizedOrganizer = props.isAuthorizedOrganizer;
    this.habeasDataAcceptedAt = props.habeasDataAcceptedAt;
  }
}

export interface UserProps {
  id?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  profile?: UserProfile | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  readonly id?: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly isEmailVerified: boolean;
  readonly profile: UserProfile | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email.toLowerCase();
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.isActive = props.isActive;
    this.isEmailVerified = props.isEmailVerified;
    this.profile = props.profile ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get fullName(): string {
    return this.profile?.fullName ?? '';
  }

  get facultyId(): string | null {
    return this.profile?.facultyId ?? null;
  }

  get isAuthorizedOrganizer(): boolean {
    return this.profile?.isAuthorizedOrganizer ?? false;
  }
}

