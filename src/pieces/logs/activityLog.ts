import {
	GuildMember,
	TextChannel,
	EmbedBuilder
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { DB } from '@root/config';

interface Activity {
	type: 'level' | 'command' | 'server' | 'class';
	command: string | null;
	level: number | null;
	msg: string;
}

// TD: track level up
export async function trackLevelUp(
	member: GuildMember,
	channelid: string
): Promise<void> {
	const channel = await member.guild.channels.fetch(channelid) as TextChannel;
	if (channel === null) {
		throw new Error('error, channel not found');
	}

	const UserCollection = member.client.mongo.collection(DB.USERS);
	const user = await UserCollection.findOne(
		{ discordId: member.id },
		{ projection: { activityLog: 1 } }
	);
	const activity: Activity = {
		type: 'level',
		command: null,
		level: user.level,
		msg: `leveled up to ${user.level}`
	};
	const embed = new EmbedBuilder()
		.setTitle(`${member.user.tag} has just leveled up to ${user.level}.`)
		.setThumbnail(member.user.avatarURL())
		.addFields({
			name: 'Level up',
			value:
				`${member.user.createdAt.toLocaleString()}, ` +
				`${prettyMilliseconds(
					Date.now() - member.user.createdTimestamp,
					{ verbose: true }
				)} ago`
		})
		.setColor('Aqua')
		.setFooter({ text: `Discord ID: ${member.id}` })
		.setTimestamp();

	await UserCollection.updateOne(
		{ discordId: member.id },
		{
			$set: { activityLog: [...user.activityLog, activity] }
		}
	);
	channel.send({ embeds: [embed] });
}

// TODO: classes
// TODO: Other metrics later
