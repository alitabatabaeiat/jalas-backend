import {getCustomRepository} from "typeorm";
import PollRepository from "../repositories/poll";
import MeetingTimeRepository from "../repositories/meetingTime";

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