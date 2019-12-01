import * as express from 'express';

import Controller from './controller';
import PollService from '../services/poll';

export default class PollController extends Controller {
    constructor() {
        super('/polls');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'POST',
            path: '/',
            handlers: [PollController.createPoll]
        }];
    };

    private static createPoll = async (req: express.Request, res: express.Response) => {
        const {user} = req;
        const poll = await PollService.getInstance().createPoll(user.id);
        res.status(201).send(poll);
    };
}