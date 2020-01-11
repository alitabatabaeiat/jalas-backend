import {getCustomRepository} from "typeorm";
import _ from "lodash";
import NotificationSettingRepository from "../repositories/notificationSetting";
import HttpException from "../exceptions/httpException";
import winston from "winston";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import NotificationSetting from "../entities/notificationSetting";
import InvalidRequestException from "../exceptions/invalidRequestException";
import {Transactional} from "typeorm-transactional-cls-hooked";

export default class NotificationSettingService {
    private static service: NotificationSettingService;
    private readonly repository: NotificationSettingRepository;

    private constructor() {
        this.repository = getCustomRepository(NotificationSettingRepository);
    };

    public static getInstance() {
        if (!NotificationSettingService.service)
            NotificationSettingService.service = NotificationSettingService._getInstance();
        return NotificationSettingService.service;
    }

    private static _getInstance = (): NotificationSettingService => new NotificationSettingService();

    @Transactional()
    public async createNotificationSetting(user, notificationSetting?) {
        try {
            const notificationSettingExist = await this.repository.findOne(user.id);
            if (!notificationSettingExist) {
                const newNotificationSetting = new NotificationSetting();
                newNotificationSetting.user = user.id;
                if (notificationSetting)
                    NotificationSettingService.setNotificationSetting(newNotificationSetting, notificationSetting);
                await this.repository.insert(newNotificationSetting);
                return _.omit(newNotificationSetting, ['createdAt', 'updatedAt']);
            } else
                throw new InvalidRequestException(`Notification setting for the user exists`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getUserNotificationSetting(user) {
        try {
            const notificationSetting = await this.repository.findOne(user.id);
            return _.omit(notificationSetting, ['createdAt', 'updatedAt']);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async updateNotificationSetting(user, notificationSetting) {
        try {
            const notificationSettingInDb = await this.repository.findOne(user.id);
            if (notificationSettingInDb) {
                await this.repository.update(user.id, notificationSetting);
                NotificationSettingService.setNotificationSetting(notificationSettingInDb, notificationSetting);
                return _.omit(notificationSettingInDb, ['createdAt', 'updatedAt']);
            } else {
                throw new ResourceNotFoundException('NotificationSetting', 'id', user.id);
            }
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    private static setNotificationSetting(notificationSettingInDb, notificationSetting) {
        notificationSettingInDb.createPoll = notificationSetting.createPoll;
        notificationSettingInDb.reserveRoom = notificationSetting.reserveRoom;
        notificationSettingInDb.chooseMeetingTime = notificationSetting.chooseMeetingTime;
        notificationSettingInDb.vote = notificationSetting.vote;
        notificationSettingInDb.addMeetingTime = notificationSetting.addMeetingTime;
        notificationSettingInDb.removeMeetingTime = notificationSetting.removeMeetingTime;
        notificationSettingInDb.cancelMeeting = notificationSetting.cancelMeeting;
        notificationSettingInDb.addParticipant = notificationSetting.addParticipant;
        notificationSettingInDb.closePoll = notificationSetting.closePoll;
    }

    static async isNotificationEnableFor(users: any | any[], settingName: string) {
        try {
            if (Array.isArray(users)) {
                users = await Promise.all(users.map(async user => {
                    const notificationSetting = await NotificationSettingService.getInstance().getUserNotificationSetting(user);
                    return notificationSetting[settingName] ? user.email : null
                }));
                return users.filter(u => u);
            } else {
                const notificationSetting = await NotificationSettingService.getInstance().getUserNotificationSetting(users);
                return notificationSetting[settingName] ? users.email : null
            }
        }
        catch (ex) {
            winston.error(ex);
        }
    }
}