import express from 'express';

import Controller from './controller';
import QualityInUseService from "../services/qualityInUse";
import authMiddleware from "../middlewares/auth";

export default class QualityInUseController extends Controller {
    constructor() {
        super('/qualityInUse');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'GET',
            path: '/',
            handlers: [authMiddleware, QualityInUseController.getFullReport]
        }];
    };

    private static getFullReport = async (req, res) => {
        const {user} = req;
        const response = await QualityInUseService.getInstance().getFullReport(user);
        res.send(response);
    };
}