class HttpException extends Error {
    public status: number;
    public errors?: any;

    constructor(status?: number, message?: string, errors?: any) {
        super(message);
        this.name = 'HttpException';
        this.status = status;
        this.errors = errors;
    }
}

export default HttpException;