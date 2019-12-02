import * as Joi from '@hapi/joi';

const idSchema = Joi.object({
    id: Joi.string().guid().required()
});

export {idSchema};