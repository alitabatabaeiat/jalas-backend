import Joi from '@hapi/joi';
import {commonRules} from "./common";

const rules = {
    title: Joi.string(),
    room: Joi.number().positive(),
    state: Joi.number().min(0).max(3),
    roomRequestedAt: Joi.date().iso(),
    meetingTimes: {
        startsAt: Joi.date().iso(),
        endsAt: Joi.date().iso().greater(Joi.ref('startsAt')),
        selected: Joi.boolean()
    },
    vote: {
        voteFor: Joi.boolean()
    },
    participants: Joi.array().items(Joi.string().email()).min(1)
};

const createPollSchema = Joi.object({
    title: rules.title.required(),
    possibleMeetingTimes: Joi.array().items(
        Joi.object({
            startsAt: rules.meetingTimes.startsAt.required(),
            endsAt: rules.meetingTimes.endsAt.required()
        })
    ).min(1).required(),
    participants: rules.participants.required()
});

const selectMeetingTime = Joi.object({
    meetingTime: Joi.object({
        id: commonRules.id.required(),
        selected: rules.meetingTimes.selected.required()
    }).required()
});

const voteMeetingTime = Joi.object({
    vote: Joi.object({
        meetingTimeId: commonRules.id.required(),
        voteFor: rules.vote.voteFor.required()
    }).required()
});

const reserveRoomSchema = Joi.object({
    room: rules.room.required()
});

const createCommentSchema = Joi.object({
    text: Joi.string().required()
});

const addMeetingTimeSchema = Joi.object({
    meetingTime: Joi.object({
        startsAt: rules.meetingTimes.startsAt.required(),
        endsAt: rules.meetingTimes.endsAt.required()
    }).required()
})

export { createPollSchema, selectMeetingTime, voteMeetingTime, reserveRoomSchema, createCommentSchema, addMeetingTimeSchema};