import 'dotenv/config';
import auth from '../../src/middlewares/auth';
import UnAuthorizedException from "../../src/exceptions/unAuthorizedException";

describe('auth middleware', () => {
    it('should throw exception if no token provided', () => {
        const req = {
            header: jest.fn().mockReturnValue(undefined)
        } as any;
        const res = {};
        const next = jest.fn();

        auth(req, res, next);

        expect(req.header).toHaveBeenCalledWith('Authorization');
        expect(next).toHaveBeenCalledWith(new UnAuthorizedException('No token provided'));
    });

    it('should throw exception if token is not valid', () => {
        const token = '13';
        const req = {
            header: jest.fn().mockReturnValue(token)
        } as any;
        const res = {};
        const next = jest.fn();

        auth(req, res, next);

        expect(req.header).toHaveBeenCalledWith('Authorization');
        expect(next).toHaveBeenCalledWith(new UnAuthorizedException('Invalid token'));
    });

    it('should populate req.user with the payload of a valid token', () => {
        const user = {
            email: 'a.tabatabaei97@gmail.com'
        };
        const token = `Bearer ${user.email}`;
        const req = {
            header: jest.fn().mockReturnValue(token)
        } as any;
        const res = {};
        const next = jest.fn();

        auth(req, res, next);

        expect(req.header).toHaveBeenCalledWith('Authorization');
        expect(req.user).toMatchObject(user);
    });
});