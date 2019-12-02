import {getCustomRepository} from "typeorm";
import {PollRepository} from "../repositories/poll";
import Poll from "../entities/poll";
import MeetingTime from "../entities/meetingTime";
import User from "../entities/user";

export default class PollService {
    private static service: PollService;
    protected repository: PollRepository;

    private constructor() {
        this.repository = getCustomRepository(PollRepository);
    };

    public static getInstance() {
        if (!PollService.service)
            PollService.service = PollService._getInstance();
        return PollService.service;
    }

    private static _getInstance = (): PollService => new PollService();

    public createPoll = async (owner, poll) => {
        let newPoll = new Poll();
        newPoll.title = poll.title;
        newPoll.owner = owner;
        newPoll.possibleMeetingTimes = poll.possibleMeetingTimes.map(possibleMeetingTime => {
            const newPMT = new MeetingTime();
            newPMT.startsAt = possibleMeetingTime.startsAt;
            newPMT.endsAt = possibleMeetingTime.endsAt;
            newPMT.poll = newPoll;
            return newPMT;
        });
        newPoll.participants = poll.participants.map(participant => {
            const user = new User();
            user.email = participant;
            return user;
        });
        newPoll = await this.repository.save(newPoll);
        newPoll.possibleMeetingTimes.forEach(meetingTime => delete meetingTime.poll);
        return newPoll;
    }
}