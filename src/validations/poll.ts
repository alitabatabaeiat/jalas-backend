import * as Joi from '@hapi/joi';

const rules = {
    title: Joi.string().regex(/^[\u0600-\u06FF ]+$/),
    room: Joi.number().positive(),
    state: Joi.number().min(0).max(3),
    roomRequestedAt: Joi.date().iso(),
    possibleMeetingTimes: {
        startsAt: Joi.date().iso(),
        endsAt: Joi.date().iso(),
        voteFor: Joi.number().min(0),
        voteAgainst: Joi.number().min(0)
    },
    meetingTimes: Joi.string().guid(),
    participants: Joi.array().items(Joi.string().email()).min(1)
};

const createPollSchema = Joi.object({
    title: rules.title.required(),
    possibleMeetingTimes: Joi.array().items(
        Joi.object(rules.possibleMeetingTimes)
    ).min(1).required(),
    participants: rules.participants.required()
});

export {createPollSchema};