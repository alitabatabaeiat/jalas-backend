import Joi from '@hapi/joi';

const rules = {
    id: Joi.string().guid()
};

const idSchema = (id = 'id') => Joi.object({
    [id]: rules.id.required()
});

export {
    rules as commonRules,
    idSchema
};