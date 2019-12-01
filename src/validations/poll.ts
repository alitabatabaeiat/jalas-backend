import * as Joi from '@hapi/joi';

const rules = {
    title: Joi.string().regex(/^[\u0600-\u06FF ]+$/),
    room: Joi.number().positive(),
    state: Joi.number().min(0).max(3),
    roomRequestedAt: Joi.date().iso(),
    possibleMeetingTimes: Joi.array().items(
        Joi.object({
            startsAt: Joi.date().iso(),
            endsAt: Joi.date().iso()
        })
    ).min(1),
    meetingTimes: Joi.string().guid(),
    participants: Joi.array().items(Joi.string().email()).min(1)
};

const createPollSchema = Joi.object({
    title: rules.title.required(),
    possibleMeetingTimes: rules.possibleMeetingTimes.required(),
    participants: rules.participants.required()
});

export {createPollSchema};