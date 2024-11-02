export interface SageUser {
	email: string;
	hash: string;
	discordId: string;
	pii: boolean;
	count: number;
	levelExp: number;
	curExp: number;
	level: number;
	levelPings: boolean;
	isVerified: boolean;
	isStaff: boolean;
	roles: Array<string>;
	courses: Array<string>;
	commandUsage: Array<string>;
	responseTime: number;
	lastMessage: string;
	timestampArray: Array<string>;
	activityLevel: string;
	isNewUser: boolean;
	commandCount: number
}
