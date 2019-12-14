import axios from 'axios';
import ReservationService from '../../src/services/reservation';
import HttpException from "../../src/exceptions/httpException";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('Reservation service', () => {
    beforeEach(() => {
        mockedAxios.get.mockClear();
    });

    it('should return list of available rooms if reservation service is available', async () => {
        const mockedResponse = {
            status: 200,
            data: [809, 10, 5, 10076]
        };
        mockedAxios.get.mockResolvedValue(mockedResponse);

        await expect(ReservationService.getInstance().getAvailableRooms(new Date(), new Date())).resolves
            .toEqual(mockedResponse.data);
        expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should throw if reservation service is not available', async () => {
        const mockedResponse = {
            status: 503
        };
        mockedAxios.get.mockRejectedValue(mockedResponse);

        await expect(ReservationService.getInstance().getAvailableRooms(new Date(), new Date())).rejects
            .toThrow(new HttpException(503, 'Reservation service unavailable'));
        expect(mockedAxios.get).toHaveBeenCalled();
    });
});