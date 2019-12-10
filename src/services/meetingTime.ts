import {EntityManager, getManager} from "typeorm";
import _ from 'lodash';
import MeetingTimeRepository from "../repositories/meetingTime";
import HttpException from "../exceptions/httpException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import MeetingTime from "../entities/meetingTime";
import InvalidRequestException from "../exceptions/invalidRequestException";

export default class MeetingTimeService {
    private static service: MeetingTimeService;
    protected repository: MeetingTimeRepository;

    private constructor() {
    };

    public static getInstance(manager?: EntityManager) {
        if (!MeetingTimeService.service)
            MeetingTimeService.service = MeetingTimeService._getInstance();
        return MeetingTimeService.service._setManager(manager);
    }

    private static _getInstance = (): MeetingTimeService => new MeetingTimeService();

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(MeetingTimeRepository);
        return this;
    };

    private _createMeetingTime = (meetingTime: { startsAt, endsAt }, pollId) => {
        const newMeetingTime = new MeetingTime();
        newMeetingTime.poll = pollId;
        newMeetingTime.startsAt = meetingTime.startsAt;
        newMeetingTime.endsAt = meetingTime.endsAt;
        return newMeetingTime;
    };

    public createMeetingTime = async (meetingTimes: { startsAt, endsAt } | Array<{ startsAt, endsAt }>, pollId) => {
        try {
            if (!Array.isArray(meetingTimes))
                meetingTimes = [meetingTimes];
            if (meetingTimes.length > 0) {
                const newMeetingTimes = meetingTimes.map(mt => this._createMeetingTime(mt, pollId));
                await this.repository.insert(newMeetingTimes);
                return newMeetingTimes.map(meetingTime => _.omit(meetingTime, ['updatedAt', 'createdAt']) as MeetingTime);
            } else
                return [];
        } catch (ex) {
            throw new HttpException();
        }
    };

    public selectMeetingTime = async (pollId, meetingTimeId) => {
        let error;
        try {
            let meetingTime = await this.repository.findOne({
                where: {poll: pollId, id: meetingTimeId},
                select: ['selected']
            });
            if (meetingTime) {
                if (!meetingTime.selected) {
                    await this.repository.update(meetingTimeId, {selected: true});
                    return meetingTime.id;
                } else
                    error = new InvalidRequestException('Meeting time was selected');
            } else
                error = new ResourceNotFoundException('MeetingTime');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };

    public getSelectedMeetingTime = async (pollId) => {
        let error;
        try {
            let meetingTime = await this.repository.findOne({
                where: {poll: pollId, selected: true},
                select: ['startsAt', 'endsAt']
            });
            if (meetingTime)
                return meetingTime;
            else
                error = new InvalidRequestException('There is no selected meeting time');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };
}