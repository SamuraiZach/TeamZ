import 'module-alias/register';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { SageUser } from '/src/lib/types/SageUser';
import { Course } from '@lib/types/Course';
import { BOT, DB, EMAIL, GUILDS, ROLES, FIRST_LEVEL } from '@root/config';

const MESSAGE = `<!DOCTYPE html>
<html>

<head>
	<title>Discord Verification</title>
</head>

<body>

	<h1 style="color:#00539F">Welcome!</h1>
	<p>You're getting this email because you're part of a class in the UD CIS Department that is using <span style="color:#738ADB">Discord</span> as its primary means of communication.</p>
	<p>For further information about the UD CIS <span style="color:#738ADB">Discord</span>, see <a href="https://ud-cis-discord.github.io/">this page.</a></p>
	<p><strong>If you don't have a <span style="color:#738ADB">Discord</span> account already, click <a href="https://discord.com/register">here</a> to sign up for one.</strong></p>
	<p>
		Once you are ready, click <a href="https://discord.gg/$invCode">here</a> to join the server and get yourself verified.
	<p>Once you're on the server, follow the instructions given to you in the channel called "getting-verified". Make sure you have your hash code (given below) ready!
	</p>

	<p>Further, usage of this Discord server means that you agree to <a href="https://docs.google.com/document/d/1ReVBzepnWvrt6bf4aRfaeHIDo4fFfEuNpOsjmGzvRdM/edit?usp=sharing">
	these rules</a>. Please take a moment to review them.</p>

	<p>Your hash code is: <span style="color:blueviolet">$hash</span></p>
	<p><br>We hope to see you on the server soon!<br>- The <span style="color:#738ADB">Discord</span> Admin Team</p>

</body>

</html>
`;

const mailer = nodemailer.createTransport({
	host: 'mail.udel.edu',
	port: 25
});

async function main() {
	const client = await MongoClient.connect(DB.CONNECTION, { useUnifiedTopology: true });
	const db = client.db(BOT.NAME).collection(DB.USERS);
	const args = process.argv.slice(2);
	let emails: Array<string>;
	let course: Course;

	if (args.length > 0) {
		if (args[0].toLowerCase() === 'staff') {
			emails = args;
		} else {
			emails = ['STUDENT', ...args];
		}
	} else {
		const data = fs.readFileSync('./resources/emails.csv');
		emails = data.toString().split('\n').map(email => email.trim());
		let courseId: string;
		[emails[0], courseId] = emails[0].split(',').map(str => str.trim());
		course = await client.db(BOT.NAME).collection(DB.COURSES).findOne({ name: courseId });
	}

	let isStaff: boolean;


	if (emails[0].toLowerCase() === 'staff') {
		isStaff = true;
	} else if (emails[0].toLowerCase() === 'student') {
		isStaff = false;
	} else {
		console.error('First value must be STAFF or STUDENT');
		process.exit();
	}

	emails.shift();
	console.log(`${'email'.padEnd(18)} | ${'staff'.padEnd(5)} | hash
-------------------------------------------------------------------------`);
	for (const email of emails) {
		if (email === '') continue;
		if (!email.endsWith('@udel.edu')) {
			console.error(`${email} is not a valid udel email.`);
			continue;
		}

		const hash = crypto.createHash('sha256').update(email).digest('base64').toString();

		const entry: SageUser = await db.findOne({ email: email, hash: hash });

		const newUser: SageUser = {
			email: email,
			hash: hash,
			isStaff: isStaff,
			discordId: '',
			count: 0,
			levelExp: FIRST_LEVEL,
			curExp: FIRST_LEVEL,
			level: 1,
			levelPings: true,
			isVerified: false,
			pii: false,
			roles: [],
			courses: [],
			commandUsage: [],
			responseTime: 0.0,
			lastMessage: '',
			timestampArray: [],
			activityLevel: 'active',
			isNewUser: true,
			messageCount: 0
		};
		/*
			----- ADDED COMPONENTS TO USERS ----
			commandUsage is an array that will be utilized as a dictionary of sorts which will count each use of specific commands that the user can use and input them into a count which can be
		which can be used for activity metrics.

			responseTime is a double and will be set as the delta or time difference between the last message and the current,
		this is helpful for tracking activity based on how fast they respond or send messages between their channel activity and keeps a form of record.
			lastMessage is a timestamp that will be utilized in the responseTime calculation such as given the timestamp of last and current the difference
		will be used to set the value of responseTime

			timestampArray is an array of array that will be set between time periods etc 12:00-12:59, 1:00-1:59,.... and the other axis of the multidimensional array
		will be M, TUE, WED, THUR, FRI, SAT, SUN then at the cross section will be a count of the users message to track peak hours and of which days

			activityLevel: activityLevel describes whether the user is active, mildly inactive, moderately inactive, or highly 
			inactive which also takes into account whether or not the user is new. inactivity level will be incremented
			if the command count for that week is 0.

			isNewUser: describes whether the user is new, will set the user as new (true) when user is onboarded. 

			messageCount: field to track the number of messages the user has sent for that week. if the number of messages
			is less than threshold for that week, then the activity level will be moved up and the messageCount will be 
			wiped weekly.

		*/

		if (course) {
			if (isStaff) {
				newUser.roles.push(course.roles.staff);
			} else {
				newUser.roles.push(course.roles.student);
				newUser.courses.push(course.name);
			}
		}

		if (isStaff) {
			newUser.roles.push(ROLES.STAFF);
		}
		newUser.roles.push(ROLES.LEVEL_ONE);

		if (entry) {			// User already on-boarded
			if (isStaff && entry.isVerified) {		// Make staff is not already
				await db.updateOne(entry, { $set: { isStaff: true } });
				console.log(`${email} was already in verified. Add staff roles manually. Discord ID ${entry.discordId}`);
			} else if (isStaff && !entry.isVerified) {
				await db.updateOne(entry, { $set: { ...newUser } });
			}
			continue;
		}

		await db.insertOne(newUser);

		console.log(`${email.padEnd(18)} | ${isStaff.toString().padEnd(5)} | ${hash}`);

		sendEmail(email, hash);
		await sleep(1100);
	}

	client.close();
}


async function sendEmail(email: string, hash: string): Promise<void> {
	mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		to: email,
		subject: 'Welcome to the UD CIS Discord!',
		html: MESSAGE.replace('$hash', hash).replace('$invCode', GUILDS.GATEWAY_INVITE)
	});
}

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

main();
