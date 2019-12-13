import nodemailer from "nodemailer";
import {google} from 'googleapis';

export default class MailService {
    private static service: MailService;
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
    };

    public static getInstance() {
        if (!MailService.service)
            MailService.service = MailService._getInstance();
        return MailService.service;
    }

    private static _getInstance = (): MailService => new MailService();

    private _smtpTransport = nodemailer.createTransport({
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

    public sendMail = async (to: string, subject: string, message: string) => {
        return await this._smtpTransport.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to, subject, text: message
        });
    };

    public sendRoomReservationUpdateMail = async (to, pollTitle, room, successful) => {
        try {
            await MailService.getInstance().sendMail(to, `Reservation state changed(${pollTitle})`,
                `Room ${room} ${successful ? 'successfully reserved.' : 'is already reserved! Please try another room.'}`);
        } catch (ex) {
        }
    }
};