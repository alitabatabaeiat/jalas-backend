import axios from 'axios';
import HttpException from "../exceptions/httpException";

export default class ReservationsService {
    private static service: ReservationsService;

    private constructor() {
    };

    public static getInstance() {
        if (!ReservationsService.service)
            ReservationsService.service = ReservationsService._getInstance();
        return ReservationsService.service;
    }

    private static _getInstance = (): ReservationsService => new ReservationsService();

    public getAvailableRooms = async (start, end) => {
        try {
            const {data} = await axios.get('http://213.233.176.40/available_rooms', {
                params: {start, end}
            });
            return data;
        } catch (ex) {
            throw new HttpException(503, 'Reservation service unavailable')
        }
    };

    public reserveRoom = async (room, username, start, end) => {
        try {
            const {data} = await axios.post(`http://213.233.176.40/rooms/${room}/reserve`, {
                username, start, end
            }, {
                timeout: 10000
            });
            console.log('data', data);
            return data;
        } catch (ex) {
            if (ex.response && (ex.response.status === 400 || ex.response.status === 404))
                throw new HttpException(ex.response.status, ex.response.data.message);
            throw new HttpException(503, 'Reservation service unavailable')
        }
    };
}