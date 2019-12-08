import HttpException from "./httpException";

class InvalidRequestException extends HttpException {
    constructor(message: string = 'Invalid request') {
        super(400, message);
        this.name = 'InvalidRequestException';
    }
}

export default InvalidRequestException;