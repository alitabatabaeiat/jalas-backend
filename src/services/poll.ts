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

    public getPolls = async (user) => {
        try {
            return await this.repository.find({where: {owner: user}});
        } catch (ex) {
            throw new HttpException();
        }
    };

    public getPoll = async (user, pollId) => {
        let error;
        try {
            const poll = await this.repository.findOne({
                where: {owner: user, id: pollId},
                relations: ['possibleMeetingTimes', 'owner', 'participants']
            });
            console.log(poll)
            if (poll) return poll;
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };

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

    public selectMeetingTime = async (user, pollId, meetingTime) => {
        let error;
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 0) {
                return await this.repository.manager.transaction(async entityManager => {
                   await entityManager.update(Poll, pollId, {state: 1});
                   await MeetingTimeService.getInstance().selectMeetingTime(entityManager, pollId, meetingTime.meetingTimeId);
                });
            } else if (poll.state !== 0)
                error = new HttpException(401, 'Meeting time selected before');
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
        throw error;
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
            } else
                error = new ResourceNotFoundException('Poll', 'id', pollId);
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    }
}