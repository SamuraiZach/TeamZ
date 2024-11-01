import { Client } from 'discord.js';
import { SageUser } from '../lib/types/SageUser';
import { schedule } from 'node-cron';
import { DB, GUILDS, ROLES } from '@root/config';
import { diffieHellman } from 'crypto';

async function registerJob(bot: Client): Promise<void> {
	checkOldUser(bot);
	schedule('0 3 * * *', () => { // run every day at 3:00am (time chosen because of low activity)
		checkOldUser(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function checkOldUser(bot: Client) {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	await guild.members.fetch();
	guild.members.cache.forEach(async (member) => {
		if (member.user.bot || !member.roles.cache.has(ROLES.VERIFIED)) return; // ignore bots/unverified members

		const currentUser = await bot.mongo.collection<SageUser>(DB.USERS).findOne({ discordId: member.user.id });
		if (!currentUser) return; // not in database (for some reason; maybe ID is not linked to a user document)

		let joinDate = member.joinedAt;
		const currentDate = new Date();


		const diffInTime = currentDate.getTime() - joinDate.getTime();
        const diffInDays = diffInTime / (1000 * 60 * 60 * 24);

		let isNew: boolean = true;
		if (diffInDays > 30) {
			isNew = false;
		}

		await bot.mongo.collection(DB.USERS).updateOne(
			{ discordId: member.id },
			{ $set: { isNewUser: isNew } });
	})

}

export default registerJob;
