import Joi from '@hapi/joi';

const idSchema = (id = 'id') => Joi.object({
    [id]: Joi.string().guid().required()
});

export {idSchema};