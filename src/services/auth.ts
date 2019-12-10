import {EntityManager, getManager} from "typeorm";
import HttpException from "../exceptions/httpException";
import UnAuthorizedException from "../exceptions/unAuthorizedException";
import UserRepository from "../repositories/user";


export default class AuthService {
    private static service: AuthService;
    protected repository: UserRepository;

    private constructor() {
    };

    public static getInstance(manager?: EntityManager) {
        if (!AuthService.service)
            AuthService.service = AuthService._getInstance();
        return AuthService.service._setManager(manager);
    }

    private static _getInstance = (): AuthService => new AuthService();

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(UserRepository);
        return this;
    };

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