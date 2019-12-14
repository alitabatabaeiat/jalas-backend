import axios from 'axios';
import moment from "moment-timezone";
import HttpException from "../exceptions/httpException";
import winston from "winston";

export default class ReservationService {
    private static service: ReservationService;
    private readonly baseURL: string = process.env.RESERVATION_SERVICE_URL;

    private constructor() {
    };

    public static getInstance() {
        if (!ReservationService.service)
            ReservationService.service = ReservationService._getInstance();
        return ReservationService.service;
    }

    private static _getInstance = (): ReservationService => new ReservationService();

    public getAvailableRooms = async (start: Date, end: Date) => {
        try {
            const {data} = await axios.get(`${this.baseURL}/available_rooms`, {
                params: {
                    start: moment(start).tz('Asia/Tehran').format('YYYY-MM-DDTHH:mm:ss'),
                    end: moment(end).tz('Asia/Tehran').format('YYYY-MM-DDTHH:mm:ss')
                },
                timeout: 10000
            });
            return data;
        } catch (ex) {
            winston.error(ex);
            throw new HttpException(503, 'Reservation service unavailable')
        }
    };

    public reserveRoom = async (room: number, username: string, start: Date, end: Date) => {
        try {
            const {data} = await axios.post(`${this.baseURL}/rooms/${room}/reserve`, {
                username,
                start: moment(start).tz('Asia/Tehran').format('YYYY-MM-DDTHH:mm:ss'),
                end: moment(end).tz('Asia/Tehran').format('YYYY-MM-DDTHH:mm:ss')
            }, {
                timeout: 10000
            });
            return data;
        } catch (ex) {
            winston.error(ex);
            if (ex.response && (ex.response.status === 400 || ex.response.status === 404))
                throw new HttpException(ex.response.status, ex.response.data.message);
            throw new HttpException(503, 'Reservation service unavailable')
        }
    };
}