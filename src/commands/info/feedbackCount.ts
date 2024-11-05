import { EmbedBuilder, TextChannel, ChatInputCommandInteraction, ApplicationCommandOptionData,
	ApplicationCommandOptionType, InteractionResponse, Message, Client, GatewayIntentBits, Events, GuildMember, MessageReaction, User } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	]
});

// Define reactionTypeMap
const reactionTypeMap: { [key: string]: string } = {
	'👍': 'Yes',
	'👎': 'No'
};

const messageId: string | null = null;


client.on(Events.MessageReactionAdd, async (reaction: MessageReaction, user: User) => {
	if (reaction.message.id !== messageId || user.bot) return;
	console.log('Reaction added to messsage: ', reaction.message.content);
	/*
	const { guild } = reaction.message;
	const reactionType = reactionTypeMap[reaction.emoji.name || ''];
	if (guild && reactionType) {
		const role = guild.roles.cache.find(r => r.name === reactionType);
		const member = await guild.members.fetch(user.id);
		if (role && member) {
			await member.roles.add(role);
			console.log(`Assigned role ${reactionType} to ${member.displayName}`);
		}
	}
	*/
});

client.on('messageReactionAdd', async (reaction, user) => {
	console.log('Reaction added to messsage: ', reaction.message.content);
	console.log(`Reaction added: ${reaction.emoji.name}`);
});
