import * as Joi from '@hapi/joi';

const envSchema = Joi.object({
    PORT: Joi.number().port().required(),
    POSTGRES_HOST: Joi.string().hostname().required(),
    POSTGRES_PORT: Joi.number().port().required(),
    POSTGRES_USER: Joi.string().required(),
    POSTGRES_PASSWORD: Joi.string().required(),
    POSTGRES_DB: Joi.string().required(),
    EMAIL_SERVICE: Joi.string().required(),
    EMAIL_ADDRESS: Joi.string().email().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    GMAIL_CLIENT_ID: Joi.string().required(),
    GMAIL_CLIENT_SECRET: Joi.string().required(),
    GMAIL_REFRESH_TOKEN: Joi.string().required()
});

export default envSchema;