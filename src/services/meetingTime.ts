import {getCustomRepository} from "typeorm";
import MeetingTimeRepository from "../repositories/meetingTime";
import HttpException from "../exceptions/httpException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import MeetingTime from "../entities/meetingTime";
import InvalidRequestException from "../exceptions/invalidRequestException";

export default class MeetingTimeService {
    private static service: MeetingTimeService;
    protected repository: MeetingTimeRepository;

    private constructor() {
        this.repository = getCustomRepository(MeetingTimeRepository);
    };

    public static getInstance() {
        if (!MeetingTimeService.service)
            MeetingTimeService.service = MeetingTimeService._getInstance();
        return MeetingTimeService.service;
    }

    private static _getInstance = (): MeetingTimeService => new MeetingTimeService();

    public selectMeetingTime = async (pollId, meetingTimeId) => {
        let error;
        try {
            let meetingTime = await this.repository.findOne({where: {poll: pollId, id: meetingTimeId}, select: ['selected']});
            if (meetingTime) {
                if (!meetingTime.selected) {
                    await this.repository.update(meetingTimeId, {selected: true});
                    return meetingTime.id;
                } else
                    error = new  InvalidRequestException('Meeting time was selected');
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
            let meetingTime = await this.repository.findOne({where: {poll: pollId, selected: true}, select: ['startsAt', 'endsAt']});
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