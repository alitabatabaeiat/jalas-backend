import axios from 'axios';
import HttpException from "../exceptions/httpException";
import moment from "moment-timezone";

export default class ReservationsService {
    private static service: ReservationsService;
    private readonly baseURL: string = 'http://213.233.176.40';

    private constructor() {
    };

    public static getInstance() {
        if (!ReservationsService.service)
            ReservationsService.service = ReservationsService._getInstance();
        return ReservationsService.service;
    }

    private static _getInstance = (): ReservationsService => new ReservationsService();

    public getAvailableRooms = async (start: string, end: string) => {
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

    public reserveRoom = async (room: number, username: string, start: string, end: string) => {
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