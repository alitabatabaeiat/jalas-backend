import 'dotenv/config';
import 'reflect-metadata';
import {createConnection} from "typeorm";

import App from "./app";
import config from "./ormconfig";

(async () => {
    try {
        await createConnection(config);
        const controllers = [];
        const app = new App(controllers);
        app.listen();
    } catch (error) {
        console.log('Error while connecting to the database', error);
        return error;
    }
})();

