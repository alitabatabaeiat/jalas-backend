import 'dotenv/config';
import 'reflect-metadata';
import {createConnection} from "typeorm";
import * as Joi from '@hapi/joi';

import App from "./app";
import config from "./ormconfig";
import envSchema from "./validations/env";

(async () => {
    try {
        const {error} = Joi.validate(process.env, envSchema, {allowUnknown: true});
        if (error) {
            console.error(error.details);
            process.exit(1);
        }
        await createConnection(config);
        const controllers = [];
        const app = new App(controllers);
        app.listen();
    } catch (error) {
        console.log('Error while connecting to the database', error);
        return error;
    }
})();

