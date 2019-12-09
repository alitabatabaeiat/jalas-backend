import dotenv from 'dotenv';
dotenv.config({path: `${__dirname}/../.env.${process.env.NODE_ENV}`});
import 'reflect-metadata';
import {createConnection} from "typeorm";

import App from "./app";
import config from "./ormconfig";
import envSchema from "./validations/env";
import PollController from "./controllers/poll";
import AuthController from "./controllers/auth";
import QualityInUseController from "./controllers/qualityInUse";
import UserService from "./services/user";


(async () => {
    try {
        const {error} = envSchema.validate(process.env, {allowUnknown: true});
        if (error) {
            console.error(error.details);
            process.exit(1);
        }
        await createConnection(config);
        await UserService.getInstance().createUser({email: 'a.tabatabaei97@gmail.com'});
        const controllers = [
            new AuthController(),
            new PollController(),
            new QualityInUseController()
        ];
        const app = new App(controllers);
        app.listen();
    } catch (error) {
        console.log('Error while connecting to the database', error);
        return error;
    }
})();

