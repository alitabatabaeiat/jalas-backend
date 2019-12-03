import 'dotenv/config';
import 'reflect-metadata';
import {createConnection} from "typeorm";

import App from "./app";
import config from "./ormconfig";
import envSchema from "./validations/env";
import PollController from "./controllers/poll";
import AuthController from "./controllers/auth";
import QualityInUseController from "./controllers/qualityInUse";

(async () => {
    try {
        const {error} = envSchema.validate(process.env, {allowUnknown: true});
        if (error) {
            console.error(error.details);
            process.exit(1);
        }
        await createConnection(config);
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

