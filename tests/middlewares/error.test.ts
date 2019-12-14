import 'dotenv/config';
import errorMiddleware from '../../src/middlewares/error';
import HttpException from "../../src/exceptions/httpException";

describe('auth middleware', () => {
    it('should send internal server error if it not exists', () => {
        const error = {} as HttpException;
        const req = null;
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        } as any;
        const next = null;

        errorMiddleware(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            status: 500,
            message: 'Internal server error'
        });
    });
});