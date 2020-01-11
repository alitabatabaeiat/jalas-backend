import Joi from '@hapi/joi';
import {commonRules} from "./common";

const rules = {
    createPoll: Joi.boolean(),
    reserveRoom: Joi.boolean(),
    selectMeetingTime: Joi.boolean(),
    vote: Joi.boolean(),
    addMeetingTime: Joi.boolean(),
    removeMeetingTime: Joi.boolean(),
    cancelMeeting: Joi.boolean(),
    addParticipant: Joi.boolean(),
    closePoll: Joi.boolean()
};

const updateNotificationSettingSchema = Joi.object({
    createPoll: rules.createPoll.required(),
    reserveRoom: rules.reserveRoom.required(),
    selectMeetingTime: rules.selectMeetingTime.required(),
    vote: rules.vote.required(),
    addMeetingTime: rules.addMeetingTime.required(),
    removeMeetingTime: rules.removeMeetingTime.required(),
    cancelMeeting: rules.cancelMeeting.required(),
    addParticipant: rules.addParticipant.required(),
    closePoll: rules.closePoll.required()
});

export {
    updateNotificationSettingSchema
};