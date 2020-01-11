import winston = require("winston");
import HttpException from "../exceptions/httpException";

export default class Service {
    public async catchErrors(tryBlock, catchBlock?) {
        try {
            return await tryBlock();
        } catch (ex) {
            if (catchBlock)
                catchBlock();
            else {
                winston.error(ex);
                if (ex instanceof HttpException)
                    throw ex;
                throw new HttpException();
            }
        }
    }
}