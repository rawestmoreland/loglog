/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Achievements = "achievements",
	Follows = "follows",
	Places = "places",
	PooChats = "poo_chats",
	PooMessages = "poo_messages",
	PooProfiles = "poo_profiles",
	PoopComments = "poop_comments",
	PoopSeshes = "poop_seshes",
	ToiletRatings = "toilet_ratings",
	UserAchievement = "user_achievement",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

export type GeoPoint = {
	lon: number
	lat: number
}

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type AchievementsRecord<Tcriteria = unknown> = {
	created: IsoAutoDateString
	criteria: null | Tcriteria
	description: string
	icon: FileNameString
	id: string
	name: string
	updated: IsoAutoDateString
}

export enum FollowsStatusOptions {
	"pending" = "pending",
	"approved" = "approved",
	"rejected" = "rejected",
}
export type FollowsRecord = {
	created: IsoAutoDateString
	follower: RecordIdString
	following: RecordIdString
	id: string
	status?: FollowsStatusOptions
}

export type PlacesRecord = {
	address?: string
	created: IsoAutoDateString
	id: string
	location: GeoPoint
	mapbox_place_id: string
	name: string
	place_formatted?: string
	place_type?: string
	updated: IsoAutoDateString
}

export type PooChatsRecord = {
	created: IsoAutoDateString
	id: string
	participant1: RecordIdString
	participant2: RecordIdString
	updated: IsoAutoDateString
}

export type PooMessagesRecord = {
	chat: RecordIdString
	content: string
	created: IsoAutoDateString
	id: string
	sender: RecordIdString
	updated: IsoAutoDateString
}

export type PooProfilesRecord = {
	codeName: string
	created: IsoAutoDateString
	expo_push_token?: string
	id: string
	shift_logs?: boolean
	updated: IsoAutoDateString
	user: RecordIdString
}

export type PoopCommentsRecord = {
	content: string
	created: IsoAutoDateString
	id: string
	sesh: RecordIdString
	user: RecordIdString
}

export type PoopSeshesRecord<Tlocation = unknown> = {
	airplane?: boolean
	bristol_score?: number
	company_time?: boolean
	coords?: GeoPoint
	created: IsoAutoDateString
	custom_place_name?: string
	ended?: IsoDateString
	id: string
	is_public?: boolean
	location: null | Tlocation
	place_id?: RecordIdString
	place_type?: string
	poo_profile: RecordIdString
	revelations?: string
	started: IsoDateString
	updated: IsoAutoDateString
	user: RecordIdString
}

export type ToiletRatingsRecord = {
	created: IsoAutoDateString
	id: string
	place_id: RecordIdString
	rating: number
	review_text?: string
	updated: IsoAutoDateString
	user_id: RecordIdString
}

export type UserAchievementRecord = {
	achievement: RecordIdString
	created: IsoAutoDateString
	id: string
	unlocked_at: IsoDateString
	updated: IsoAutoDateString
	user: RecordIdString
}

export type UsersRecord = {
	avatar?: FileNameString
	codeName: string
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AchievementsResponse<Tcriteria = unknown, Texpand = unknown> = Required<AchievementsRecord<Tcriteria>> & BaseSystemFields<Texpand>
export type FollowsResponse<Texpand = unknown> = Required<FollowsRecord> & BaseSystemFields<Texpand>
export type PlacesResponse<Texpand = unknown> = Required<PlacesRecord> & BaseSystemFields<Texpand>
export type PooChatsResponse<Texpand = unknown> = Required<PooChatsRecord> & BaseSystemFields<Texpand>
export type PooMessagesResponse<Texpand = unknown> = Required<PooMessagesRecord> & BaseSystemFields<Texpand>
export type PooProfilesResponse<Texpand = unknown> = Required<PooProfilesRecord> & BaseSystemFields<Texpand>
export type PoopCommentsResponse<Texpand = unknown> = Required<PoopCommentsRecord> & BaseSystemFields<Texpand>
export type PoopSeshesResponse<Tlocation = unknown, Texpand = unknown> = Required<PoopSeshesRecord<Tlocation>> & BaseSystemFields<Texpand>
export type ToiletRatingsResponse<Texpand = unknown> = Required<ToiletRatingsRecord> & BaseSystemFields<Texpand>
export type UserAchievementResponse<Texpand = unknown> = Required<UserAchievementRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	achievements: AchievementsRecord
	follows: FollowsRecord
	places: PlacesRecord
	poo_chats: PooChatsRecord
	poo_messages: PooMessagesRecord
	poo_profiles: PooProfilesRecord
	poop_comments: PoopCommentsRecord
	poop_seshes: PoopSeshesRecord
	toilet_ratings: ToiletRatingsRecord
	user_achievement: UserAchievementRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	achievements: AchievementsResponse
	follows: FollowsResponse
	places: PlacesResponse
	poo_chats: PooChatsResponse
	poo_messages: PooMessagesResponse
	poo_profiles: PooProfilesResponse
	poop_comments: PoopCommentsResponse
	poop_seshes: PoopSeshesResponse
	toilet_ratings: ToiletRatingsResponse
	user_achievement: UserAchievementResponse
	users: UsersResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
