import Joi from '@hapi/joi';

const rules = {
    email: Joi.string().email(),
    password: Joi.string()
};

const loginSchema = Joi.object({
    email: rules.email.required(),
    password: rules.password.required()
});

export {loginSchema};