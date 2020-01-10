import {EntityRepository, Repository} from "typeorm";
import NotificationSetting from "../entities/notificationSetting";

@EntityRepository(NotificationSetting)
export default class NotificationSettingRepository extends Repository<NotificationSetting> {
}