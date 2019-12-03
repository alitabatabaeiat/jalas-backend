import {getCustomRepository} from "typeorm";
import MeetingTimeRepository from "../repositories/meetingTime";
import HttpException from "../exceptions/httpException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import MeetingTime from "../entities/meetingTime";

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
            let meetingTime = await this.repository.findOne({where: {poll: pollId, id: meetingTimeId}});
            if (meetingTime) {
                await this.repository.update(meetingTimeId, {selected: true});
                return meetingTime;
            } else error = new ResourceNotFoundException('MeetingTime');
        } catch (ex) {
            console.log(ex)
            throw new HttpException();
        }
        throw error;
    };

    public getSelectedMeetingTime = async (pollId) => {
        let error;
        try {
            let meetingTime = await this.repository.findOne({where: {poll: pollId, selected: true}, select: ['startsAt', 'endsAt']});
            if (meetingTime) return meetingTime;
            else error = new HttpException();
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };

    public updateVotes = async (pollId, meetingTimes) => {
        const result = await this.repository.query(`
            update meeting_times as mt set
                vote_for = c.vote_for,
                vote_against = c.vote_against
            from (values
                ${
            meetingTimes.reduce((query, meetingTime) => query + `('${meetingTime.id}', ${meetingTime.voteFor}, ${meetingTime.voteAgainst}),`,
                '').slice(0, -1)
        }
            ) as c(id, vote_for, vote_against) 
            where c.id = mt.id::text and mt."pollId" = '${pollId}';
        `);
        return result;
    }
}