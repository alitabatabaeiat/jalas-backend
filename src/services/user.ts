import {EntityManager, getManager} from "typeorm";
import HttpException from "../exceptions/httpException";
import UserRepository from "../repositories/user";
import User from "../entities/user";
import InvalidRequestException from "../exceptions/invalidRequestException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";


export default class UserService {
    private static service: UserService;
    private mainRepository: UserRepository;
    private repository: UserRepository;

    private constructor() {
        this.mainRepository = getManager().getCustomRepository(UserRepository);
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
        try {
            const userExist = await this.mainRepository.findOne({email: user.email}, {select: ['id']});
            if (!userExist) {
                let newUser = new User();
                newUser.email = user.email;
                await this.repository.insert(newUser);
                return {
                    message: 'User created successfully',
                    accessToken: `Bearer ${user.email}`
                }
            } else
                throw new InvalidRequestException(`User with email '${user.email} exists'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public getUser = async (userEmail: string) => {
        try {
            const user = await this.mainRepository.findOne({email: userEmail}, {select: ['id', 'email']});
            if (user)
                return user;
            else
                throw new ResourceNotFoundException(User.name, 'email', userEmail);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };
}