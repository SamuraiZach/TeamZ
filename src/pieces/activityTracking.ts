import {
	Client,
	GuildMember,
	Role
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { DB } from '@root/config';

async function register(bot: Client): Promise<void> {
	bot.on('guildMemberAdd', async member => {
		trackJoinLeave(member, 'join').catch(async error => bot.emit('error', error));
	});

	bot.on('guildMemberUpdate', async (old, updated) => {
		const added = old.roles.cache.difference(updated.roles.cache);
		if (added.size > 1) {
			added.forEach((role: Role) => {
				trackRoles(old as GuildMember, 'remove', role).catch(async error => bot.emit('error', error));
			});
		}
	});
	bot.on('guildMemberUpdate', async (old, updated) => {
		const removed = updated.roles.cache.difference(old.roles.cache);
		if (removed.size > 1) {
			removed.forEach((role: Role) => {
				trackRoles(updated as GuildMember, 'add', role).catch(async error => bot.emit('error', error));
			});
		}
	});
	bot.on('guildMemberAdd', async member => {
		const user = await bot.mongo.collection(DB.USERS).findOne({ discordId: member.user.id });

		if (user.find({ activityLog: { $elemMatch: { activityName: 'Server Join' } } }).size > 0) {
			trackJoinLeave(member, 'rejoin').catch(async error => bot.emit('error', error));
		} else {
			trackJoinLeave(member, 'join');
		}
	});

	bot.on('guildMemberRemove', async member => {
		trackJoinLeave(member as GuildMember, 'leave');
	});
}

// TD: track level up
export async function trackLevelUp(
	member: GuildMember
): Promise<void> {
	const bot: Client = member.client;
	if (!bot) {
		return;
	}
	const UserCollection = bot.mongo.collection(DB.USERS);
	const activity = {
		activityTime: prettyMilliseconds(
			Date.now() - member.user.createdTimestamp,
			{ verbose: true }
		),
		activityName: 'Level up',
		activityDescription: 'User has leveled up',
		activityType: 'messaging'
	};

	await UserCollection.updateOne(
		{ discordId: member.id },
		{
			$push: { activityLog: activity }
		}
	);
}

async function trackRoles(
	member: GuildMember,
	type: 'add' | 'remove',
	role: Role
): Promise<void> {
	const bot: Client = member.client;
	if (!bot) {
		return;
	}
	const UserCollection = bot.mongo.collection(DB.USERS);
	let activity: { activityTime: string; activityName: string; activityDescription: string; activityType: string; };
	if (role.name.includes('CISC')) {
		activity = {
			activityTime: prettyMilliseconds(
				Date.now(), { verbose: true }
			),
			activityName: 'Class role change',
			activityDescription: type === 'add' ? `User added to ${role}` : `${role} was removed from User`,
			activityType: 'Class change'
		};
	} else {
		activity = {
			activityTime: prettyMilliseconds(
				Date.now(), { verbose: true }
			),
			activityName: 'role change',
			activityDescription: type === 'add' ? `User was given ${role}` : `${role} was removed from User`,
			activityType: 'role change'
		};
	}

	await UserCollection.updateOne(
		{ discordId: member.id },
		{
			$push: { activityLog: activity }
		}
	);
}

async function trackJoinLeave(
	member: GuildMember,
	type: 'join' | 'rejoin' | 'leave'
): Promise<void> {
	const bot: Client = member.client;
	if (!bot) {
		return;
	}
	const UserCollection = bot.mongo.collection(DB.USERS);
	const activity = {
		activityTime: prettyMilliseconds(
			Date.now(), { verbose: true }
		),
		activityName: type === 'join' ? 'Server Join' : type === 'rejoin' ? 'Server Rejoin' : 'Server Leave',
		activityDescription: type === 'join' ? `User was first joined the server` : type === 'rejoin' ? `User rejoined the server` : 'Usre left the server',
		activityType: 'Member Status'
	};

	await UserCollection.updateOne(
		{ discordId: member.id },
		{
			$push: { activityLog: activity }
		}
	);
}


export default register;
