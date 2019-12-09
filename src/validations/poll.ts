import Joi from '@hapi/joi';

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
        Joi.object({
            startsAt: rules.possibleMeetingTimes.startsAt.required(),
            endsAt: rules.possibleMeetingTimes.endsAt.required()
        })
    ).min(1).required(),
    participants: rules.participants.required()
});

const updateVotesSchema = Joi.object({
    possibleMeetingTimes: Joi.array().items(
        Joi.object({
            voteFor: rules.possibleMeetingTimes.voteFor.required(),
            voteAgainst: rules.possibleMeetingTimes.voteAgainst.required()
        })
    ).min(1).required(),
});

const reserveRoomSchema = Joi.object({
    room: rules.room.required()
});

export {createPollSchema, updateVotesSchema, reserveRoomSchema};