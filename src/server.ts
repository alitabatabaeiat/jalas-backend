import 'dotenv/config';
import 'reflect-metadata';
import {createConnection} from "typeorm";
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional-cls-hooked';

import App from "./app";
import config from "./ormconfig";
import envSchema from "./validations/env";
import PollController from "./controllers/poll";
import AuthController from "./controllers/auth";
import QualityInUseController from "./controllers/qualityInUse";
import UserService from "./services/user";
import winston from "winston";
import CommentController from "./controllers/comment";
import NotificationSettingController from "./controllers/notificationSetting";

process.on('unhandledRejection', ex => {
    throw ex
});

(async () => {
    try {
        const {error} = envSchema.validate(process.env, {allowUnknown: true});
        if (error) {
            console.error(error.details);
            process.exit(1);
        }
        initializeTransactionalContext();
        patchTypeORMRepositoryWithBaseRepository();
        const controllers = [
            new AuthController(),
            new PollController(),
            new CommentController(),
            new NotificationSettingController(),
            new QualityInUseController()
        ];
        const app = new App(controllers);
        await createConnection(config);
        winston.info(`Connected to database...`);
        try {
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@gmail.com', fullName: 'علی طباطبایی'});
            await UserService.getInstance().createUser({email: 'h.ghadimi1998@gmail.com', fullName: 'حبیب قدیمی'});
            await UserService.getInstance().createUser({email: 'm.nourbakhsh75@gmail.com', fullName: 'مهرداد نوربخش'});
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@icloud.com', fullName: 'علی طباطبایی ۲'});
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@hotmail.com', fullName: 'علی طباطبایی ۳'});
        } catch (ex) {
            console.log(ex);
        }
        app.listen();
    } catch (error) {
        winston.error(error);
        winston.error(`Error while connecting to database '${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}'`);
        return error;
    }
})();

