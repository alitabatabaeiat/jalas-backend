import * as express from 'express';

import Controller from './controller';
import AuthService from "../services/auth";
import validationMiddleware from "../middlewares/validation";
import {loginSchema} from "../validations/auth";

class AuthController extends Controller {
    constructor() {
        super('/auth');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'POST',
            path: '/login',
            handlers: [validationMiddleware({body: loginSchema}), AuthController.login]
        }];
    };

    private static login = async (req: express.Request, res: express.Response) => {
        const {body} = req;
        const response = await AuthService.getInstance().login(body);
        res.send(response);
    };
}

export default AuthController;