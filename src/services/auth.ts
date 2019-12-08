import {getCustomRepository} from "typeorm";
import HttpException from "../exceptions/httpException";
import UnAuthorizedException from "../exceptions/unAuthorizedException";
import UserRepository from "../repositories/user";


export default class AuthService {
    private static service: AuthService;
    protected repository: UserRepository;

    private constructor() {
        this.repository = getCustomRepository(UserRepository);
    };

    public static getInstance() {
        if (!AuthService.service)
            AuthService.service = AuthService._getInstance();
        return AuthService.service;
    }

    private static _getInstance = (): AuthService => new AuthService();

    public login = async ({email}) => {
        let error;
        try {
            const user = await this.repository.findOne({where: {email}});
            if (user) {
                return {
                    message: 'User logged in successfully',
                    accessToken: `Bearer ${email}`
                }
            } else
                error = new UnAuthorizedException('Incorrect credential');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };
}