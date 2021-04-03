import { ActivityType } from 'discord.js';

export interface SageData {
	status: {
		type: ActivityType;
		name: string;
	***REMOVED***
	commandStatus: Array<{ command: string, enabled: boolean }>;
}
