import {EntityManager, getCustomRepository, getManager} from "typeorm";
import HttpException from "../exceptions/httpException";
import UserRepository from "../repositories/user";
import User from "../entities/user";
import InvalidRequestException from "../exceptions/invalidRequestException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";


export default class UserService {
    private static service: UserService;
    protected repository: UserRepository;

    private constructor() {
        this.repository = getCustomRepository(UserRepository);
    };

    public static getInstance(manager?: EntityManager) {
        if (!UserService.service)
            UserService.service = UserService._getInstance();
        return UserService.service._setManager(manager);
    }

    private static _getInstance = (): UserService => new UserService();

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(UserRepository);
        return this;
    };

    public createUser = async (user) => {
        let error;
        try {
            const userExist = await this.repository.findOne({email: user.email}, {select: ['id']});
            if (!userExist) {
                let newUser = new User();
                newUser.email = user.email;
                await this.repository.insert(newUser);
                return {
                    message: 'User created successfully',
                    accessToken: `Bearer ${user.email}`
                }
            } else
                error = new InvalidRequestException(`User with email '${user.email} exists'`);
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };

    public getUser = async (userEmail: string) => {
        let error;
        try {
            const user = await this.repository.findOne({email: userEmail}, {select: ['id', 'email']});
            if (user)
                return user;
            else
                error = new ResourceNotFoundException(User.name, 'email', userEmail);
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };
}