import express from 'express';

import Controller from './controller';
import QualityInUseService from "../services/qualityInUse";

export default class QualityInUseController extends Controller {
    constructor() {
        super('/qualityInUse');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'GET',
            path: '/reservedRooms',
            handlers: [QualityInUseController.reservedRooms]
        }, {
            method: 'GET',
            path: '/changedPolls',
            handlers: [QualityInUseController.changedPolls]
        }, {
            method: 'GET',
            path: '/pollAverageCreationTime',
            handlers: [QualityInUseController.pollAverageCreationTime]
        }];
    };

    private static reservedRooms = async (req: express.Request, res: express.Response) => {
        const response = await QualityInUseService.getInstance().getNumberOfReservedRooms();
        res.send(response);
    };

    private static changedPolls = async (req: express.Request, res: express.Response) => {
        const response = await QualityInUseService.getInstance().getNumberOfChangedPolls();
        res.send(response);
    };

    private static pollAverageCreationTime = async (req: express.Request, res: express.Response) => {
        const response = await QualityInUseService.getInstance().getAverageCreationTime();
        res.send(response);
    };
}