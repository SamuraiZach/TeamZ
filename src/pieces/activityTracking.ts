import {
	GuildMember,
	TextChannel,
	EmbedBuilder
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { DB } from '@root/config';

// TD: track level up
export async function trackLevelUp(
	member: GuildMember,
	channel: TextChannel
): Promise<void> {
	const UserCollection = member.client.mongo.collection(DB.USERS);
	const user = await UserCollection.findOne(
		{ discordId: member.id }
	);
	const activity = {
		activityTime: prettyMilliseconds(
			Date.now() - member.user.createdTimestamp,
			{ verbose: true }
		),
		activityName: 'Level up',
		activityDescription: 'User has leveled up',
		activityType: 'messaging'
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
			$push: { activityLog: activity }
		}
	);
	channel.send({ embeds: [embed] });
}
