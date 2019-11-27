import 'dotenv/config';
import 'reflect-metadata';

import App from "./app";

(async () => {
    const controllers = [];
    const app = new App(controllers);
    app.listen();
})();

