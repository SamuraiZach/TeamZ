export interface PublicFeedbackLog {
	id: string;
	feedback: string;
	owner: string;
	reactYes: [users];
	reactNo: [users];
	attachment: string;
}
