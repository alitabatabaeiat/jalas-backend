import * as Joi from '@hapi/joi';
import * as express from 'express';
import HttpException from "../exceptions/httpException";
import ValidationException from "../exceptions/validationException";

function validationMiddleware(validationSchema: any): express.RequestHandler {
    return async (req, res, next) => {
        try {
            let errors = {
                params: [],
                body: []
            };
            if (validationSchema.params)
                errors.params = validate(req.params, validationSchema.params);
            if (validationSchema.body)
                errors.body = validate(req.body, validationSchema.body);
            if (validationSchema.query)
                errors.body = validate(req.query, validationSchema.query);

            if (errors.params.length > 0 || errors.body.length > 0)
                return next(new ValidationException(mapErrors(errors)));
            next();
        } catch (ex) {
            next(new HttpException());
        }
    }
}

const validate = (value, schema) => {
    const {error} = schema.validate(value, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error && error.details.length > 0)
        return error.details;
    return [];
};

const mapErrors = (errors) => {
    const mappedErrors = {};

    const mapDetail = (key, detail) => {
        if (!mappedErrors[key])
            mappedErrors[key] = {};
        // pick and then remove first element from detail.path
        if (detail.path.length > 0) {
            const path = detail.path.shift();

            if (detail.path.length > 0) {
                if (!mappedErrors[key][path])
                    mappedErrors[key] = mapErrors({[path]: [detail]});
                else
                    Object.assign(mappedErrors[key][path], mapErrors({[detail.path.shift()]: [detail]}));
            } else
                mappedErrors[key][path] = detail.message;
        } else
            mappedErrors[key] = detail.message;
    };
    Object.entries(errors).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0)
            value.forEach(detail => mapDetail(key, detail));
    });

    return mappedErrors;
};

export default validationMiddleware;