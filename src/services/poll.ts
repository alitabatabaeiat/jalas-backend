import {getCustomRepository} from "typeorm";
import {Transactional} from 'typeorm-transactional-cls-hooked';
import moment from "moment";
import _ from "lodash";
import winston from "winston";
import PollRepository from "../repositories/poll";
import Poll from "../entities/poll";
import MeetingTimeService from "./meetingTime";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import HttpException from "../exceptions/httpException";
import ReservationService from "./reservation";
import QualityInUseService from "./qualityInUse";
import InvalidRequestException from "../exceptions/invalidRequestException";
import UserService from "./user";
import MailService from "./mail";
import CommentService from "./comment";

export default class PollService {
    private static service: PollService;
    private readonly repository: PollRepository;

    private constructor() {
        this.repository = getCustomRepository(PollRepository);
    };

    public static getInstance() {
        if (!PollService.service)
            PollService.service = PollService._getInstance();
        return PollService.service;
    }

    private static _getInstance = (): PollService => new PollService();

    @Transactional()
    public async createPoll(owner, poll) {
        try {
            let newPoll = new Poll();
            newPoll.title = poll.title;
            newPoll.owner = owner;
            newPoll.participants = await Promise.all(poll.participants.map(async participant =>
                await UserService.getInstance().getUser(participant)
            ));
            await this.repository.save(newPoll);
            newPoll.possibleMeetingTimes = await MeetingTimeService.getInstance().createMeetingTime(poll.possibleMeetingTimes, newPoll.id);
            MailService.getInstance().sendPollURL([owner.email, ...poll.participants], newPoll.id, poll.title);
            return newPoll;
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    @Transactional()
    public async getPolls(user) {
        try {
            const polls = await this.repository.findAllThatUserParticipates(user.id);
            polls.forEach(poll => (<any>poll).owner = poll.owner.id === user.id);
            return polls;
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async getPoll(user, pollId: string) {
        try {
            const poll = await this.repository.findOneThatUserParticipateOnIt(pollId, user.email);
            if (poll) {
                poll.possibleMeetingTimes.forEach(meetingTime =>
                    _.remove(meetingTime.votes, vote => {
                        const mustRemove = !vote.voter;
                        delete vote.voter;
                        return mustRemove
                    })
                );
                return poll;
            } else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getAvailableRooms(user, pollId: string) {
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                const meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                return await ReservationService.getInstance().getAvailableRooms(meetingTime.startsAt, meetingTime.endsAt);
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state !== 1)
                throw new InvalidRequestException('First you must select a meeting time');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async reserveRoom(user, pollId: string, {room}) {
        let poll, meetingTime;
        try {
            poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                const result = await ReservationService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                await this.repository.update(pollId, {state: 3, room, roomRequestedAt: moment().toISOString()});
                await QualityInUseService.getInstance().reserveRoom();
                await QualityInUseService.getInstance().pollCreated(pollId);
                MailService.getInstance().sendRoomReservationUpdateMail(user.email, poll.title, room, true);
                return result;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state !== 1)
                throw new InvalidRequestException('First you must select a meeting time');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException) {
                // Reservation service unavailable
                if (ex.status === 503) {
                    await this.repository.update(pollId, {state: 2, room, roomRequestedAt: moment().toISOString()});
                    let interval = setInterval(async () => {
                        let status;
                        try {
                            await ReservationService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                            status = 200;
                        } catch (ex) {
                            status = ex.status;
                        }
                        if (interval) {
                            if (status === 200) {
                                clearInterval(interval);
                                interval = null;
                                await this.repository.update(pollId, {state: 3});
                                await QualityInUseService.getInstance().reserveRoom();
                                await QualityInUseService.getInstance().pollCreated(pollId);
                                MailService.getInstance().sendRoomReservationUpdateMail(user.email, poll.title, room, true);
                            } else if (status === 400) {
                                clearInterval(interval);
                                interval = null;
                                await this.repository.update(pollId, {state: 1, room: null, roomRequestedAt: null});
                                MailService.getInstance().sendRoomReservationUpdateMail(user.email, poll.title, room, false);
                            }
                        }
                    }, 1000);
                }
                throw ex;
            }
            throw new HttpException();
        }
    }

    public selectMeetingTime = async (user, pollId: string, {meetingTime}) => {
        if (!meetingTime.selected)
            throw new InvalidRequestException('You cannot deselect meeting time');
        try {
            const poll = await this.repository.findOne({
                where: {owner: user, id: pollId},
                relations: ['participants']
            });
            if (poll && poll.state === 0) {
                await this.repository.update(pollId, {state: 1});
                const updatedMeetingTime = await MeetingTimeService.getInstance().updateMeetingTime(pollId, meetingTime.id, meetingTime);
                await QualityInUseService.getInstance().pollChanged(pollId);
                await QualityInUseService.getInstance().userEntersPollPage(pollId);
                MailService.getInstance().sendPollURL([user.email, ...poll.participants.map(p => p.email)], poll.id, poll.title);
                return updatedMeetingTime;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state > 0)
                throw new InvalidRequestException('Poll already has a meeting time');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public voteMeetingTime = async (user, pollId: string, {vote}) => {
        try {
            const poll = await this.repository.findOneThatUserParticipateOnItWithMeetingTimeVote(pollId, user.email, vote.meetingTimeId);
            if (poll && poll.state === 0 && (poll.owner || poll.participants.length > 0) && poll.possibleMeetingTimes.length > 0) {
                _.remove(poll.possibleMeetingTimes[0].votes, vote => !vote.voter);
                poll.possibleMeetingTimes[0].votes.forEach(vote => delete vote.voter);
                vote.voter = poll.participants[0] || poll.owner;
                let voteMeetingTime = await MeetingTimeService.getInstance().saveVote(poll.possibleMeetingTimes[0], vote);
                MailService.getInstance().sendVoteNotificationMail(poll.owner.email,poll.title,vote.voter.email,vote.voteFor)
                return voteMeetingTime
            } else if (!poll)
                throw new ResourceNotFoundException('Poll');
            else if (poll.state > 0)
                throw new InvalidRequestException('A meeting time has been set for poll');
            else if (!(poll.owner || poll.participants.length > 0))
                throw new InvalidRequestException(`You're not owner or a participant of poll`);
            else if (poll.possibleMeetingTimes.length === 0)
                throw new InvalidRequestException(`There is no meetingTime with id '${vote.meetingTimeId}' for poll`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public removePoll = async (user, pollId: string) => {
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state < 3) {
                await this.repository.delete(pollId);
                await QualityInUseService.getInstance().pollChanged(pollId);
                return `Poll '${poll.id}' removed successfully`;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state === 3)
                throw new InvalidRequestException('Poll cannot be removed');
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    @Transactional()
    public async createComment(user, pollId: any, {text}) {
        try {
            // TODO: must change it
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll) {
                (<any>poll).newComment = await CommentService.getInstance().createComment(user, poll, text);
                return poll;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public addMeetingTime = async (user, pollId: string, {meetingTime}) => {
        try{
            const poll = await this.repository.findOne({ where: { owner: user, id: pollId },relations: ['participants']});
            if(poll){
                let newMeetingTime = await MeetingTimeService.getInstance().createMeetingTime(meetingTime, pollId);
                await QualityInUseService.getInstance().pollChanged(pollId);
                MailService.getInstance().addMeetingTimeNotificationMail(poll.participants.map(p => p.email),poll.title);
                return newMeetingTime
            }else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        }catch (ex){
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}