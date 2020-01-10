import Controller from './controller';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {
    updateNotificationSettingSchema
} from '../validations/notificationSetting';
import {idSchema} from "../validations/common";
import NotificationSettingService from "../services/notificationSetting";

export default class NotificationSettingController extends Controller {
    constructor() {
        super('/notification-settings');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'GET',
            path: '/',
            handlers: [authMiddleware, NotificationSettingController.getNotificationSetting]
        }, {
            method: 'PUT',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({
                body: updateNotificationSettingSchema
            }), NotificationSettingController.updateNotificationSetting]
        }];
    };

    private static getNotificationSetting = async (req, res) => {
        const {user} = req;
        const response = await NotificationSettingService.getInstance().getUserNotificationSetting(user);
        res.send(response);
    };

    private static updateNotificationSetting = async (req, res) => {
        const {user, body} = req;
        const response = await NotificationSettingService.getInstance().updateNotificationSetting(user, body);
        res.send(response);
    };
}