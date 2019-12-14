import axios from 'axios';
import moment from "moment-timezone";
import HttpException from "../exceptions/httpException";

export default class ReservationService {
    private static service: ReservationService;
    private readonly baseURL: string = 'http://213.233.176.40';

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
            if (ex.response && (ex.response.status === 400 || ex.response.status === 404))
                throw new HttpException(ex.response.status, ex.response.data.message);
            throw new HttpException(503, 'Reservation service unavailable')
        }
    };
}