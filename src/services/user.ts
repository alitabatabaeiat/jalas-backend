import {getCustomRepository} from "typeorm";
import HttpException from "../exceptions/httpException";
import UserRepository from "../repositories/user";
import User from "../entities/user";
import InvalidRequestException from "../exceptions/invalidRequestException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import NotificationSettingService from "./notificationSetting";
import { Transactional } from "typeorm-transactional-cls-hooked";


export default class UserService {
    private static service: UserService;
    private readonly repository: UserRepository;

    private constructor() {
        this.repository = getCustomRepository(UserRepository);
    };

    public static getInstance() {
        if (!UserService.service)
            UserService.service = UserService._getInstance();
        return UserService.service;
    }

    private static _getInstance = (): UserService => new UserService();

    @Transactional()
    public async createUser(user) {
        try {
            const userExist = await this.repository.findOne({email: user.email}, {select: ['id']});
            if (!userExist) {
                let newUser = new User();
                newUser.email = user.email;
                newUser.password = '123456';
                newUser.fullName = user.fullName;
                await this.repository.insert(newUser);
                await NotificationSettingService.getInstance().createNotificationSetting(newUser);
                return 'User created successfully';
            } else
                throw new InvalidRequestException(`User with email '${user.email} exists'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getUser(userEmail: string) {
        try {
            const user = await this.repository.findOne({email: userEmail}, {select: ['id', 'email', 'fullName']});
            if (user)
                return user;
            else
                throw new ResourceNotFoundException(User.name, 'email', userEmail);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}