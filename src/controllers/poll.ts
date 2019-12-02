import * as express from 'express';

import Controller from './controller';
import PollService from '../services/poll';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {createPollSchema} from "../validations/poll";
import {idSchema} from "../validations/common";

export default class PollController extends Controller {
    constructor() {
        super('/polls');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'GET',
            path: '/',
            handlers: [authMiddleware, PollController.getPolls]
        }, {
            method: 'GET',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({params: idSchema()}), PollController.getPoll]
        }, {
            method: 'GET',
            path: '/:id/rooms',
            handlers: [authMiddleware, validationMiddleware({params: idSchema()}), PollController.getAvailableRooms]
        }, {
            method: 'POST',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({body: createPollSchema}), PollController.createPoll]
        }, {
            method: 'PUT',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({params: idSchema(), body: idSchema('meetingTimeId')}), PollController.updatePoll]
        }];
    };

    private static getPolls = async (req: express.Request, res: express.Response) => {
        const {user, body} = req;
        const polls = await PollService.getInstance().getPolls(user.email);
        res.send(polls);
    };

    private static getPoll = async (req: express.Request, res: express.Response) => {
        const {user, params} = req;
        const polls = await PollService.getInstance().getPoll(user.email, params.id);
        res.send(polls);
    };

    private static getAvailableRooms = async (req: express.Request, res: express.Response) => {
        const {user, params} = req;
        const polls = await PollService.getInstance().getAvailableRooms(user.email, params.id);
        res.send(polls);
    };

    private static createPoll = async (req: express.Request, res: express.Response) => {
        const {user, body} = req;
        const poll = await PollService.getInstance().createPoll(user.email, body);
        res.status(201).send(poll);
    };

    private static updatePoll = async (req: express.Request, res: express.Response) => {
        const {user, params, body} = req;
        const response = await PollService.getInstance().selectMeetingTime(user.email, params.id, body);
        res.send(response);
    }
}