import {getCustomRepository} from "typeorm";
import PollRepository from "../repositories/poll";
import Poll from "../entities/poll";
import MeetingTime from "../entities/meetingTime";
import User from "../entities/user";
import MeetingTimeService from "./meetingTime";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import HttpException from "../exceptions/httpException";

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
    };

    public updateVotes = async (userId, pollId, updateVotes) => {
        let error;
        try {
            const poll = await this.repository.findOne(pollId, {
                loadRelationIds: {
                    relations: ['owner', 'participants']
                }
            });
            if (poll) {
                if (poll.owner === userId || poll.participants.find(participant => participant === userId) === userId)
                    return await MeetingTimeService.getInstance().updateVotes(pollId, updateVotes.possibleMeetingTimes);
                else
                    error = new HttpException(403, 'sorry you cannot vote for this poll');
            }
            else
                error = new ResourceNotFoundException('Poll', 'id', pollId);
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    }
}