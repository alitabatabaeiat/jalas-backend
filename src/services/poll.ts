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

export default class PollService {
    private static service: PollService;
    private readonly repository: PollRepository;
    private intervals = {};

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
            poll.participants = poll.participants.filter(p => p !== owner.email);
            newPoll.participants = await Promise.all(poll.participants.map(async participant =>
                await UserService.getInstance().getUser(participant)
            ));
            await this.repository.save(newPoll);
            newPoll.possibleMeetingTimes = await MeetingTimeService.getInstance().createMeetingTime(poll.possibleMeetingTimes, newPoll.id);
            MailService.getInstance().sendPollURLAfterCreatePoll(newPoll.participants, newPoll.id, poll.title);
            return newPoll;
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public async getPolls(user) {
        try {
            const polls: any = await this.repository.findThatUserParticipates(user.id);
            polls.forEach(poll => poll.owner = poll.owner.id === user.id);
            return polls;
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getPoll(user, pollId) {
        try {
            const poll = await this.repository.findOneThatUserParticipatesWithRelations(pollId, user.email);
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
            if (poll && (poll.state === 1 || poll.state === 100 || poll.state != 200)) {
                const meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                return await ReservationService.getInstance().getAvailableRooms(meetingTime.startsAt, meetingTime.endsAt);
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state !== 1 && poll.state !== 100)
                throw new InvalidRequestException('First you must select a meeting time');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async reserveRoom(user, pollId: string, {room}) {
        let poll, meetingTime;
        try {
            poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && (poll.state === 1 || poll.state === 100 || poll.state != 200)) {
                meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                const result = await ReservationService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                await this.repository.update(pollId, {state: 3, room, roomRequestedAt: moment().toISOString()});
                await QualityInUseService.getInstance().reserveRoom();
                await QualityInUseService.getInstance().pollCreated(pollId);
                MailService.getInstance().sendRoomReservationUpdateMail(user, poll.title, room, true);
                return result;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state !== 1 && poll.state !== 100)
                throw new InvalidRequestException('First you must select a meeting time');
            else if (poll.state == 200)
                throw new InvalidRequestException('This meeting is canceled');
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException) {
                // Reservation service unavailable
                if (ex.status === 503) {
                    await this.repository.update(poll.id, {state: 2, room, roomRequestedAt: moment().toISOString()});
                    this.intervals[poll.id] = setInterval(async () => this.retryReserveRoom(user, poll, meetingTime, room),
                        20000);
                }
                throw ex;
            }
            throw new HttpException();
        }
    }

    @Transactional()
    private async retryReserveRoom(user, poll, meetingTime, room) {
        try {
            if (this.intervals[poll.id]) {
                await ReservationService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                this.clearInterval(poll.id);
                await this.repository.update(poll.id, {state: 3});
                await QualityInUseService.getInstance().reserveRoom();
                await QualityInUseService.getInstance().pollCreated(poll.id);
                MailService.getInstance().sendRoomReservationUpdateMail(user, poll.title, room, true);
            }
        } catch (ex) {
            winston.error(ex);
            if (this.intervals[poll.id] && ex.status === 400) {
                this.clearInterval(poll.id);
                await this.repository.update(poll.id, {state: 1, room: null, roomRequestedAt: null});
                MailService.getInstance().sendRoomReservationUpdateMail(user, poll.title, room, false);
            }
        }
    }

    private clearInterval(id) {
        clearInterval(this.intervals[id]);
        delete this.intervals[id];
    }

    public selectMeetingTime = async (user, pollId: string, {meetingTime}) => {
        if (!meetingTime.selected)
            throw new InvalidRequestException('You cannot deselect meeting time');
            try {
                const poll = await this.repository.findOne({
                    where: {owner: user, id: pollId},
                    relations: ['participants']
                });
                if (poll && (poll.state < 2 || poll.state ==100)) {
                    await this.repository.update(pollId, {state: 1});
                    try{
                        let prevSelectedMeetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId)
                        if(prevSelectedMeetingTime){
                            let prevDeselectedMeetingTime = {
                                'id': prevSelectedMeetingTime.id,
                                'selected' : false
                            }
                            let updatePrevSelected = await MeetingTimeService.getInstance().updateMeetingTime(pollId, prevDeselectedMeetingTime.id, prevDeselectedMeetingTime);
                        }
                    }catch(x){
                        
                    }
                    const updatedMeetingTime = await MeetingTimeService.getInstance().updateMeetingTime(pollId, meetingTime.id, meetingTime);
                    await QualityInUseService.getInstance().pollChanged(pollId);
                    await QualityInUseService.getInstance().userEntersPollPage(pollId);
                    MailService.getInstance().sendPollURLAfterSelectMeetingTime(poll.participants, poll.id, poll.title);
                    return updatedMeetingTime;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state > 0)
                throw new InvalidRequestException('Poll already has a meeting time');
            else if (poll.state == 200)
                throw new InvalidRequestException('This meeting is canceled');
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
            if (poll && poll.state < 3  && (poll.owner || poll.participants.length > 0) && poll.possibleMeetingTimes.length > 0) {
                _.remove(poll.possibleMeetingTimes[0].votes, vote => !vote.voter);
                poll.possibleMeetingTimes[0].votes.forEach(vote => delete vote.voter);
                vote.voter = poll.participants[0] || poll.owner;
                let voteMeetingTime = await MeetingTimeService.getInstance().saveVote(poll.possibleMeetingTimes[0], vote);
                MailService.getInstance().sendVoteNotificationMail(poll.owner, poll.title, vote.voter.email)
                return voteMeetingTime
            } else if (!poll)
                throw new ResourceNotFoundException('Poll');
            else if (poll.state > 1 && poll.state != 100 && poll.state != 200)
                throw new InvalidRequestException('A meeting time has been set for poll');
            else if (poll.state == 100)
                throw new InvalidRequestException('This poll is closed by the owner');
            else if (poll.state == 200)
                throw new InvalidRequestException('This meeting is canceled by the owner');
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
            if (poll && poll.state != 3) {
                if (this.intervals[poll.id])
                    this.clearInterval(poll.id);
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

    public addMeetingTime = async (user, pollId: string, {meetingTime}) => {
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}, relations: ['participants']});
            if (poll && poll.state < 2) {
                let newMeetingTime = await MeetingTimeService.getInstance().createMeetingTime(meetingTime, pollId);
                await QualityInUseService.getInstance().pollChanged(pollId);
                MailService.getInstance().addMeetingTimeNotificationMail(poll.participants, poll.title);
                return newMeetingTime
            } 
            else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state == 100)
                throw new ResourceNotFoundException(`This poll is closed by the owner`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public removeMeetingTime = async (user, pollId: string, { meetingTime }) => {
        try {
            const poll = await this.repository.findOne({ where: { owner: user, id: pollId }});
            if (poll && poll.state < 2) {
                let oldMeetingTime = await MeetingTimeService.getInstance().removeMeetingTime(meetingTime.id)
                await QualityInUseService.getInstance().pollChanged(pollId);
                MailService.getInstance().removeMeetingTimeNotificationMail(oldMeetingTime.votes.map(p => p.voter), poll.title);
                return `meeting time '${oldMeetingTime.id}' removed successfully`
            } 
            else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state == 100)
                throw new ResourceNotFoundException(`This poll is closed by the owner`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
    public closePoll = async (user, pollId: string) => {
        try {
            const poll = await this.repository.findOne({ where: { owner: user, id: pollId },relations: ['participants'] });
            if (poll && (poll.state == 0 || poll.state == 200)) {
                await this.repository.update(pollId, {state: 100});
                await QualityInUseService.getInstance().pollChanged(pollId);
                MailService.getInstance().closePollNotificationMail(poll.participants, poll.title);
                return `Poll '${poll.id}' closed successfully`;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state > 0 && poll.state != 200)
                throw new InvalidRequestException(`Can't close the poll`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
    public cancelMeeting = async (user, pollId: string) => {
        try {
            const poll = await this.repository.findOne({ where: { owner: user, id: pollId }, relations: ['participants'] });
            if (poll && poll.state == 3) {
                await this.repository.update(pollId, { state: 200 });
                await QualityInUseService.getInstance().pollChanged(pollId);
                MailService.getInstance().cancelMeetingNotificationMail(poll.participants, poll.title);
                return `Meeting  canceled successfully`;
            } else if (!poll)
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            else if (poll.state < 3 || poll.state == 100)
                throw new InvalidRequestException(`You should set the meeting first`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    
    public addParticipant = async (owner, pollId: string, { user }) => {
        try {
            let poll = await this.repository.findOne({ where: { owner: owner, id: pollId },relations: ['participants'] });
            if(poll && poll.state < 2 && owner.email != user.email){
                let newUser = await UserService.getInstance().getUser(user.email)
                poll.participants.push(newUser)
                await this.repository.save(poll);
                MailService.getInstance().sendAddNewParticipantNotification(poll.participants,poll.title)
                return poll
            }else if(!poll){
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            }
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public removeParticipant = async (owner, pollId: string, { user }) => {
        try {
            let poll = await this.repository.findOne({ where: { owner: owner, id: pollId }, relations: ['participants'] });
            if (poll && poll.state < 2 && owner.email != user.email) {
                poll.participants = _.remove(poll.participants,(p)=> {
                    return p.email != user.email});
                await this.repository.save(poll);
                MailService.getInstance().sendRemoveParticipantNotification(poll.participants,poll.title)
                return poll
            } else if (!poll) {
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
            }
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

}