import jwt from 'jsonwebtoken';
import UnAuthorizedException from "../exceptions/unAuthorizedException";

export default async function auth(req, res, next) {
    let token = req.header('Authorization');
    if (token)
        token = req.header('Authorization').replace('Bearer ', '');
    else
        next(new UnAuthorizedException('No token provided'));
    try {
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: (<any>decodedToken).id,
            email: (<any>decodedToken).email,
            fullName: (<any>decodedToken).fullName
        };
        next();
    } catch (ex) {
        next(new UnAuthorizedException('Invalid token'));
    }
}