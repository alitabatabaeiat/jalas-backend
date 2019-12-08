import HttpException from "./httpException";

class UnAuthorizedException extends HttpException {
    constructor(message: string) {
        super(401, message);
        this.name = 'UnAuthorizedException';
    }
}

export default UnAuthorizedException;