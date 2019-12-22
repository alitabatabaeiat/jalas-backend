import {getCustomRepository} from "typeorm";
import jwt from 'jsonwebtoken';
import HttpException from "../exceptions/httpException";
import UnAuthorizedException from "../exceptions/unAuthorizedException";
import UserRepository from "../repositories/user";
import winston from "winston";


export default class AuthService {
    private static service: AuthService;
    private readonly repository: UserRepository;

    private constructor() {
        this.repository = getCustomRepository(UserRepository);
    };

    public static getInstance() {
        if (!AuthService.service)
            AuthService.service = AuthService._getInstance();
        return AuthService.service;
    }

    private static _getInstance = (): AuthService => new AuthService();

    public async login({email, password}) {
        try {
            const user = await this.repository.findOne({where: {email}, select: ['id', 'email', 'password', 'fullName']});
            if (user && user.password === password) {
                const token = this.getAccessToken(user);
                return {
                    message: 'User logged in successfully',
                    accessToken: `Bearer ${token}`
                }
            } else
                throw new UnAuthorizedException('Incorrect username or password');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    private getAccessToken = ({id, email, fullName}) => {
        return jwt.sign(
            {id, email, fullName},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );
    };
}