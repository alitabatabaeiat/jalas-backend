import nodemailer from "nodemailer";
import {google} from 'googleapis';

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
        });
    };

    public sendRoomReservationUpdateMail = (to: string, pollTitle: string, room: number, successful: boolean) => {
        this.sendMail(to, `Reservation state changed(${pollTitle})`,
            `Room ${room} ${successful ? 'successfully reserved.' : 'is already reserved! Please try another room.'}`);
    };

    public sendPollURL = (to: string[], pollId: string, pollTitle: string) => {
        this.sendMail(to, `Poll For meeting '${pollTitle}'`,
            `Hi there, you can checkout the link below to see all details about meeting '${pollTitle}' that ${to[0]} arranged.` +
            `${process.env.FRONTEND_URL}/polls/${pollId}`
        );
    };
};