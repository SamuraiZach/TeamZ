import { Client, TextChannel, Role, Message, EmbedBuilder, PartialMessage, ThreadChannel, ChannelType } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { CHANNELS, DB, ROLES, GUILDS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { calcNeededExp } from '@lib/utils/generalUtils';
// import { trackLevelUp } from './activityTracking';


const startingColor = 80;
const greenIncrement = 8;
const maxGreen:[number, number, number] = [0, 255, 0];
const maxLevel = 20;
const countedChannelTypes = [
	ChannelType.GuildText,
	ChannelType.PublicThread,
	ChannelType.PrivateThread
];

async function register(bot: Client): Promise<void> {
	bot.on('messageCreate', async msg => {
		countMessages(msg).catch(async error => bot.emit('error', error));
	});
	bot.on('messageDelete', async msg => {
		if (msg.content && msg.content.startsWith('s;')) return;
		handleExpDetract(msg);
	});
}

async function countMessages(msg: Message): Promise<void> {
	const bot = msg.client;

	if (
		!countedChannelTypes.includes(msg.channel.type)
		|| msg.guild?.id !== GUILDS.MAIN
		|| msg.author.bot
	) {
		return;
	}

	const { channel } = msg;

	let countInc = 0;
	const validChannel = (channel instanceof TextChannel) && (!channel.topic || (channel.topic && !channel.topic.startsWith('[no message count]')));
	const validThread = (channel instanceof ThreadChannel) && channel.name.includes('private');
	if (validChannel || validThread) {
		countInc++;
	}
	const timestamp = new Date().toString();
	const timestampDay = new Date().toString().substring(0, 3);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const timestampMinutes = new Date().toString().substring(0, 3);
	const currentEpoch = Date.now();

	bot.mongo.collection(DB.USERS).findOneAndUpdate(
		{ discordId: msg.author.id },
		{ $inc: { count: countInc, curExp: -1, messageCount: countInc } }, // message count is wiped every week
		(err, { value }) => handleLevelUp(err, value as SageUser, msg)
			.catch(async error => bot.emit('error', error))
	);
	// this function will make sure lastMessage isnt empty we need to make a case for if it is empty blah blah blah
	const lastEmpty = await bot.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
	if (lastEmpty.lastMessage === -1) {
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $set: { lastMessage: currentEpoch } }
		);
	} else {
		const responseTime2 = (currentEpoch - lastEmpty.lastMessage) / 1000;
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $set: { lastMessage: currentEpoch, responseTime: responseTime2 } }
		);
	}
	// test pushing basic activity object to the array of objects for activity logs
	const activityObject = {
		activityTime: timestamp
	};
	console.log(activityObject);
	bot.mongo.collection(DB.USERS).findOneAndUpdate(
		{ discordId: msg.author.id },
		{ $push: { activityLog: activityObject } });
	//
	// TIME STAMP HERE!!!!!!!!!!!!!!!!!!!!!!!!!
	const returnUser = await bot.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
	console.log(returnUser.timestampArray);
	const arrayTA = returnUser.timestampArray;
	// WE GRAB THE TIME STAMP ARRAY
	const findDay = arrayTA.findIndex(i => i[0] === timestampDay);
	// DAY's WILL BE THE FIRST SLOT ON EACH ARRAY IF IT CANNOT FIND THE DAY IT WILL PUSH A NEW DAY
	console.log('findDay: ', findDay);
	const timeUTC = timestamp.substring(16, 18);
	if (findDay === -1) {
		console.log('couldnt find creating new: ', timestampDay);
		const newArray = [timestampDay, {
			timeSlot: timeUTC,
			messageCount: 1
		}];
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $push: { timestampArray: newArray } });
	// eslint-disable-next-line no-empty
	} else {
		console.log(arrayTA[findDay]);
		console.log(timeUTC);
		const findTimeSlot = arrayTA[findDay].findIndex(i => i.timeSlot === timeUTC);
		console.log(findTimeSlot);
		if (findTimeSlot === -1) {
			const newSlot = {
				timeSlot: timeUTC,
				messageCount: 1
			};
			console.log('making new time slot');
			arrayTA[findDay].push(newSlot);
			bot.mongo.collection(DB.USERS).findOneAndUpdate(
				{ discordId: msg.author.id },
				{ $push: { timestampArray: arrayTA } });
		} else {
			const daytimeobject = arrayTA[findDay][findTimeSlot];
			daytimeobject.messageCount++;
			arrayTA[findDay][findTimeSlot] = daytimeobject;
			bot.mongo.collection(DB.USERS).update({ discordId: msg.author.id }, { $set: { timestampArray: arrayTA } });
		}
	}
	//
}

async function handleExpDetract(msg: Message | PartialMessage) {
	const bot = msg.client;
	let user: SageUser;
	try {
		user = await msg.author.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
	} catch (error) { // message deleted is a partial, cannot get user, so ignore.
		return;
	}

	if (user.curExp < user.levelExp) {
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: 0, curExp: +1 } }
		);
	} else if (user.level > 1) { // if exp for this level exceeds the max, roll back a level.
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $set: { curExp: 1, levelExp: calcNeededExp(user.levelExp, '-') }, $inc: { level: -1 } }
		);
	}

	if (user.count >= 1) { // it wouldn't make sense to have a negative message count (when using s;check here)
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: -1, curExp: 0 } }
		);
	}
}

async function handleLevelUp(err: Error, entry: SageUser, msg: Message): Promise<void> {
	if (err) {
		throw err;
	}

	if (!entry) {
		throw new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`);
	}

	if (--entry.curExp <= 0) {
		entry.curExp = entry.levelExp = calcNeededExp(entry.levelExp, '+');
		entry.level++;
		if (entry.levelPings) {
			sendLevelPing(msg, entry);
		}
		let addRole: Role;
		if (!(addRole = msg.guild.roles.cache.find(r => r.name === `Level ${entry.level}`))
			&& entry.level <= maxLevel) { // make a new level role if it doesn't exist
			addRole = await msg.guild.roles.create({
				name: `Level ${entry.level}`,
				color: createLevelRgb(entry.level),
				position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
				permissions: BigInt(0),
				reason: `${msg.author.username} is the first to get to Level ${entry.level}`
			});
		}

		if (entry.level <= maxLevel) {
			await msg.member.roles.remove(msg.member.roles.cache.find(r => r.name.startsWith('Level')), `${msg.author.username} leveled up.`);
			msg.member.roles.add(addRole, `${msg.author.username} leveled up.`);
			// trackLevelUp(msg.member, msg.guild.channels.cache.get('1293259236280893591') as TextChannel);
		}

		if (entry.level > maxLevel
			&& !(addRole = msg.guild.roles.cache.find(r => r.name === `Power User`))) {
			addRole = await msg.guild.roles.create({
				name: `Power User`,
				color: maxGreen,
				position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
				permissions: BigInt(0),
				reason: `${msg.author.username} is the first to become a power user!`
			});
		}
		if (entry.level > maxLevel && !msg.member.roles.cache.find(r => r.name === 'Power User')) {
			msg.member.roles.remove(msg.member.roles.cache.find(r => r.name.startsWith('Level')), `${msg.author.username} leveled up.`);
			msg.member.roles.add(addRole, `${msg.author.username} leveled up.`);
			// trackLevelUp(msg.member, msg.guild.channels.cache.get('1293259236280893591') as TextChannel);
		}

		msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { ...entry } });
	}
}

async function sendLevelPing(msg: Message, user: SageUser): Promise<Message> {
	let embedText: string;
	if (startingColor + (user.level * greenIncrement) >= 255 - greenIncrement) {
		embedText = `Congratulations, you have advanced to level ${user.level}!
		\nYou're about as green as you can get, but keep striving for higher levels to show off to your friends!`;
	} else {
		embedText = `Congratulations ${msg.author.username}, you have advanced to level ${user.level}!\n Keep up the great work!`;
	}
	const embed = new EmbedBuilder()
		.setThumbnail(msg.author.avatarURL())
		.setTitle('<:steve_peace:883541149032267816> Level up!')
		.setDescription(embedText)
		.addFields({ name: 'XP to next level:', value: user.levelExp.toString(), inline: true })
		.setColor(createLevelRgb(user.level))
		.setFooter({ text: 'You can turn the messages off by using the `/togglelevelpings` command' })
		.setTimestamp();

	// eslint-disable-next-line no-extra-parens
	return (msg.guild.channels.cache.get(CHANNELS.SAGE) as TextChannel).send({
		content: `${msg.member}, you have leveled up!`,
		embeds: [embed]
	});
}

function createLevelRgb(level: number): [number, number, number] {
	return [2, Math.min(startingColor + (level * greenIncrement), 255), 0];
}

export default register;
