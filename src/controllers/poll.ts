import Controller from './controller';
import PollService from '../services/poll';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {
    createCommentSchema,
    createPollSchema,
    reserveRoomSchema,
    selectMeetingTime,
    voteMeetingTime,
    addMeetingTimeSchema,
    removeCommentSchema,
    updateCommentSchema
} from "../validations/poll";
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
            method: 'DELETE',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({params: idSchema()}), PollController.removePoll]
        }, {
            method: 'PATCH',
            path: '/:id/meeting-times',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: selectMeetingTime
            }), PollController.updateMeetingTime]
        }, {
            method: 'POST',
            path: '/:id/votes',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: voteMeetingTime
            }), PollController.voteMeetingTime]
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
        }, {
            method: 'POST',
            path: '/:id/meeting-times',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: addMeetingTimeSchema
            }), PollController.addMeetingTime]
        }];
    };

    private static getPolls = async (req, res) => {
        const {user, body} = req;
        const polls = await PollService.getInstance().getPolls(user);
        res.send(polls);
    };

    private static getPoll = async (req, res) => {
        const {user, params} = req;
        const poll = await PollService.getInstance().getPoll(user, params.id);
        res.send(poll);
    };

    private static getAvailableRooms = async (req, res) => {
        const {user, params} = req;
        const polls = await PollService.getInstance().getAvailableRooms(user, params.id);
        res.send(polls);
    };

    private static reserveRoom = async (req, res) => {
        const {user, params, body} = req;
        const polls = await PollService.getInstance().reserveRoom(user, params.id, body);
        res.send(polls);
    };

    private static createPoll = async (req, res) => {
        const {user, body} = req;
        const poll = await PollService.getInstance().createPoll(user, body);
        res.status(201).send(poll);
    };

    private static updateMeetingTime = async (req, res) => {
        const {user, params, body} = req;
        const response = await PollService.getInstance().selectMeetingTime(user, params.id, body);
        res.send(response);
    };

    private static voteMeetingTime = async (req, res) => {
        const {user, params, body} = req;
        const response = await PollService.getInstance().voteMeetingTime(user, params.id, body);
        res.send(response);
    };

    private static removePoll = async (req, res) => {
        const {user, params} = req;
        const response = await PollService.getInstance().removePoll(user, params.id);
        res.send('Poll removed successfully');
    }

    private static addMeetingTime = async (req, res) => {
        const {user, params, body} = req;
        const response = await PollService.getInstance().addMeetingTime(user, params.id, body);
        res.send(response);
    }
}