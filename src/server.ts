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
        await createConnection(config);
        winston.info(`Connected to database...`);
        try {
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@gmail.com'});
            await UserService.getInstance().createUser({email: 'h.ghadimi1998@gmail.com'});
            await UserService.getInstance().createUser({email: 'm.nourbakhsh75@gmail.com'});
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@icloud.com'});
            await UserService.getInstance().createUser({email: 'a.tabatabaei97@hotmail.com'});
            await UserService.getInstance().createUser({email: 'ali@gmail.com'});
            await UserService.getInstance().createUser({email: 'gholam@gmail.com'});
            await UserService.getInstance().createUser({email: 'bashir@gmail.com'});
            await UserService.getInstance().createUser({email: 'saeed@gmail.com'});
        } catch (ex) {}
        const controllers = [
            new AuthController(),
            new PollController(),
            new QualityInUseController()
        ];
        const app = new App(controllers);
        app.listen();
    } catch (error) {
        winston.error('Error while connecting to the database');
        return error;
    }
})();

