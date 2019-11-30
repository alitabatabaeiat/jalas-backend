import { Router } from 'express';
import asyncMiddleware from "../middlewares/async";

export interface RouterMatch {
    method: string,
    path: string,
    handlers: Function[]
}

abstract class Controller {
    public router: Router;
    private readonly path: string;
    protected routerMatches: Array<RouterMatch>;

    protected constructor(path: string) {
        this.router = Router();
        this.path = path;
        this.initRouterMatches();
        this.initRoutes();
    }

    protected abstract initRouterMatches();

    protected initRoutes() {
        this.routerMatches.forEach(routerMatch => {
            const {method, path, handlers} = routerMatch;
            const requestHandler = handlers.pop();
            this.router[method.toLowerCase()](this.path + path, handlers, asyncMiddleware(requestHandler));
        });
    }
}

export default Controller;