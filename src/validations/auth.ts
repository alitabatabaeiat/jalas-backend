import * as Joi from '@hapi/joi';

const rules = {
    email: Joi.string().email()
};

const loginSchema = Joi.object({
    email: rules.email.required()
});

export {loginSchema};