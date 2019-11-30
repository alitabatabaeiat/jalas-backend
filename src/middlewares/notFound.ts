import { NextFunction, Request, Response } from 'express';
import HttpException from "../exceptions/httpException";

function notFoundMiddleware(request: Request, response: Response, next: NextFunction) {
    next(new HttpException(404, 'Not Found'));
}

export default notFoundMiddleware;