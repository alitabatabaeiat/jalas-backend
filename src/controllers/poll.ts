import * as express from 'express';

import Controller from './controller';
import PollService from '../services/poll';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {createPollSchema, reserveRoomSchema} from "../validations/poll";
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
            method: 'POST',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({body: createPollSchema}), PollController.createPoll]
        }, {
            method: 'PUT',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: idSchema('meetingTimeId')
            }), PollController.updatePoll]
        }, {
            method: 'DELETE',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({params: idSchema()}), PollController.removePoll]
        }, {
            method: 'GET',
            path: '/:id/rooms',
            handlers: [authMiddleware, validationMiddleware({params: idSchema()}), PollController.getAvailableRooms]
        }, {
            method: 'POST',
            path: '/:id/rooms',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: reserveRoomSchema
            }), PollController.reserveRoom]
        }];
    };

    private static getPolls = async (req, res) => {
        const {user, body} = req;
        const polls = await PollService.getInstance().getPolls(user.email);
        res.send(polls);
    };

    private static getPoll = async (req, res) => {
        const {user, params} = req;
        const polls = await PollService.getInstance().getPoll(user.email, params.id);
        res.send(polls);
    };

    private static getAvailableRooms = async (req, res) => {
        const {user, params} = req;
        const polls = await PollService.getInstance().getAvailableRooms(user.email, params.id);
        res.send(polls);
    };

    private static reserveRoom = async (req, res) => {
        const {user, params, body} = req;
        const polls = await PollService.getInstance().reserveRoom(user.email, params.id, body);
        res.send(polls);
    };

    private static createPoll = async (req, res) => {
        const {user, body} = req;
        const poll = await PollService.getInstance().createPoll(user.email, body);
        res.status(201).send(poll);
    };

    private static updatePoll = async (req, res) => {
        const {user, params, body} = req;
        const response = await PollService.getInstance().selectMeetingTime(user.email, params.id, body);
        res.send(response);
    }

    private static removePoll = async (req, res) => {
        const {user, params} = req;
        const response = await PollService.getInstance().removePoll(user.email, params.id);
        res.send('Poll removed successfully');
    }
}