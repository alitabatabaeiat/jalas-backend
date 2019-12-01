import HttpException from "./httpException";

class ValidationException extends HttpException {
    constructor(errors: { [property: string]: { [property: string]: string } }) {
        super(400, 'Validation error', errors);
        this.name = 'ValidationException';
    }
}

export default ValidationException;