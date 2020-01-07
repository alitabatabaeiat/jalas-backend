import Joi from '@hapi/joi';
import {commonRules} from "./common";

const rules = {
    text: Joi.string()
};

const createCommentSchema = Joi.object({
    text: rules.text.required(),
    replyTo: commonRules.id,
    pollId: commonRules.id.required()
});

const updateCommentSchema = Joi.object({
    text: rules.text.required()
});

export {
    createCommentSchema,
    updateCommentSchema
};