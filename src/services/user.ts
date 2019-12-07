import {getCustomRepository} from "typeorm";
import HttpException from "../exceptions/httpException";
import UserRepository from "../repositories/user";
import User from "../entities/user";


export default class UserService {
    private static service: UserService;
    protected repository: UserRepository;

    private constructor() {
        this.repository = getCustomRepository(UserRepository);
    };

    public static getInstance() {
        if (!UserService.service)
            UserService.service = UserService._getInstance();
        return UserService.service;
    }

    private static _getInstance = (): UserService => new UserService();

    public createUser = async (user) => {
        let error;
        try {
            let newUser = new User();
            newUser.email = user.email;
            await this.repository.save(newUser);
            return {
                message: 'User created successfully',
                accessToken: `Bearer ${user.email}`
            }
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };
}