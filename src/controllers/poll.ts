import * as express from 'express';

import Controller from './controller';
import PollService from '../services/poll';
import validationMiddleware from "../middlewares/validation";
import {createPollSchema} from "../validations/poll";

export default class PollController extends Controller {
    constructor() {
        super('/polls');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'POST',
            path: '/',
            handlers: [validationMiddleware(createPollSchema), PollController.createPoll]
        }];
    };

    private static createPoll = async (req: express.Request, res: express.Response) => {
        const {user, body} = req;
        const poll = await PollService.getInstance().createPoll(user.id, body);
        res.status(201).send(poll);
    };
}