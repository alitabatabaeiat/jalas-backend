import * as Joi from '@hapi/joi';
import UnAuthorizedException from "../exceptions/UnAuthorizedException";

export default async function auth(req, res, next) {
    let token = req.header('Authorization');
    if (token)
        token = req.header('Authorization').replace('Bearer ', '');
    else
        next(new UnAuthorizedException('No token provided'));
    const {error} = Joi.string().email().validate(token);
    if (error)
        return next(new UnAuthorizedException('Invalid token'));
    req.user = {
        email: token
    };
    next();
}