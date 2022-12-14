import nodemailer from "nodemailer";
import {google} from 'googleapis';
import NotificationSettingService from "./notificationSetting";

export default class MailService {
    private static service: MailService;
    private readonly _smtpTransport;
    private readonly accessToken;

    private constructor() {
        const OAuth2 = google.auth.OAuth2;

        const oauth2Client = new OAuth2(
            process.env.GMAIL_CLIENT_ID, // ClientID
            process.env.GMAIL_CLIENT_SECRET, // Client Secret
            "https://developers.google.com/oauthplayground" // Redirect URL
        );
        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
        this.accessToken = oauth2Client.getAccessToken();
        this._smtpTransport = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_ADDRESS,
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: this.accessToken
            }
        });
    };

    public static getInstance() {
        if (!MailService.service)
            MailService.service = MailService._getInstance();
        return MailService.service;
    }

    private static _getInstance = (): MailService => new MailService();

    public sendMail = (to: string | string[], subject: string, message: string) => {
        this._smtpTransport.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to, subject, text: message
        }, (err) => console.log(err));
    };

    public sendRoomReservationUpdateMail = async (to: string, pollTitle: string, room: number, successful: boolean) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'reserveRoom');
        if (to)
            this.sendMail(to, `Reservation state changed(${pollTitle})`,
                `Room ${room} ${successful ? 'successfully reserved.' : 'is already reserved! Please try another room.'}`);
    };

    public sendPollURLAfterCreatePoll = async (to: any[], pollId: string, pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'createPoll');
        if (to)
            this.sendMail(to, `Poll For meeting '${pollTitle}'`,
                `Hi there, you can checkout the link below to see all details about meeting '${pollTitle}' that ${to[0]} arranged.` +
                `${process.env.FRONTEND_URL}/polls/${pollId}`
            );
    };

    public sendPollURLAfterSelectMeetingTime = async (to: any[], pollId: string, pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'selectMeetingTime');
        if (to)
            this.sendMail(to, `Poll For meeting '${pollTitle}'`,
                `Hi there, you can checkout the link below to see all details about meeting '${pollTitle}' that ${to[0]} arranged.` +
                `${process.env.FRONTEND_URL}/polls/${pollId}`
            );
    };

    public sendVoteNotificationMail = async (to: any, pollTitle: string, user: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'vote');
        if (to)
            this.sendMail(to, `Vote For meeting '${pollTitle}'`,
                `User ${user} voted for this meeting.`
            );
    };

    public addMeetingTimeNotificationMail = async (to: any[], pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'addMeetingTime');
        if (to)
            this.sendMail(to, `add new meeting time for '${pollTitle}'`,
                `A new meeting time added to this meeting by the owner. check it out !!`
            );
    }
    public removeMeetingTimeNotificationMail = async (to: any[], pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'removeMeetingTime');
        if (to)
            this.sendMail(to, `remove meeting time from '${pollTitle}'`,
                `The meeting time you voted has been deleted.`
            );
    }
    public closePollNotificationMail = async (to: any[], pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'closePoll');
        if (to)
            this.sendMail(to, `close poll '${pollTitle}'`,
                `This poll is closed by the owner`
            );
    }
    public cancelMeetingNotificationMail = async (to: any[], pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'cancelMeeting');
        if (to)
            this.sendMail(to, `cancel meeting '${pollTitle}'`,
                `This meeting is canceled by the owner`
            );
    }
    public sendAddNewParticipantNotification = async (to: any[],pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'addParticipant');
        if (to)
            this.sendMail(to, `Add new participant to Poll For meeting '${pollTitle}'`,
                `New participant added to this meeting by owner`
            );
    };
    public sendRemoveParticipantNotification = async (to: any[], pollTitle: string) => {
        to = await NotificationSettingService.isNotificationEnableFor(to, 'addParticipant');
        if (to)
            this.sendMail(to, `Remove a participant from Poll For meeting '${pollTitle}'`,
                `A participant removed from this meeting by owner`
            );
    };
};