import {
	Client,
	GuildMember,
	TextChannel,
	EmbedBuilder,
	User,
	PartialUser,
	AuditLogEvent,
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { DB, GUILDS, CHANNELS } from '@root/config';


interface activity {
	type: 'level' | 'command' | 'server' | 'class',
	command: string | null,
	level: number | null,
	msg: string
}



// TD: track level up
async function trackLevelUp(
	member: GuildMember,
	channel: TextChannel
): Promise<void> {
	const UserCollection = member.client.mongo.collection(DB.USERS);
	const activities = await UserCollection.findOne({ discordId: member.id }, { projection: { activityLog: 1 } });
	const embed = new EmbedBuilder()
		.setTitle(`${member.user.tag} has just leveled up to ${DB.USERS}.`)
		.setThumbnail(member.user.avatarURL())
		.addFields({
			name: 'Level up',
			value:
				`${member.user.createdAt.toLocaleString()}, ` +
				`${prettyMilliseconds(
					Date.now() - member.user.createdTimestamp,
					{ verbose: true }
				)} ago`,
		})
		.setColor('Aqua')
		.setFooter({ text: `Discord ID: ${member.id}` })
		.setTimestamp();

	await UserCollection.updateOne({ discordId: member.id },{
		$set:
		{ activityLog: [...activities, {type: 'level', command: null,level: }]}
	}  )
	channel.send({ embeds=[embed] });
}

// TODO: classes
// TODO: Other metrics later
