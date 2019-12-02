import HttpException from "./httpException";

class ResourceNotFoundException extends HttpException {
    constructor(resourceName: string, fieldName?: string, fieldValue?: string) {
        if (fieldName && fieldValue)
            super(404, `${resourceName} with ${fieldName}: ${fieldValue} not found`);
        else
            super(404, `${resourceName} not found`);
        this.name = 'ResourceNotFoundException'
    }
}

export default ResourceNotFoundException;