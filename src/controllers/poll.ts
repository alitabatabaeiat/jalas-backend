import * as express from 'express';

import Controller from './controller';
import PollService from '../services/poll';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {createPollSchema, updateVotesSchema} from "../validations/poll";
import {idSchema} from "../validations/common";

export default class PollController extends Controller {
    constructor() {
        super('/polls');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'POST',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({body: createPollSchema}), PollController.createPoll]
        }, {
            method: 'PUT',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({params: idSchema, body: updateVotesSchema}), PollController.updatePoll]
        }];
    };

    private static createPoll = async (req: express.Request, res: express.Response) => {
        const {user, body} = req;
        const poll = await PollService.getInstance().createPoll(user.email, body);
        res.status(201).send(poll);
    };

    private static updatePoll = async (req: express.Request, res: express.Response) => {
        const {user, params, body} = req;
        const poll = await PollService.getInstance().updateVotes(user.email, params.id, body);
        res.status(200).send(poll);
    }
}