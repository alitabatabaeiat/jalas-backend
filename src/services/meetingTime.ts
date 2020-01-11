import {getCustomRepository} from "typeorm";
import {Transactional} from "typeorm-transactional-cls-hooked";
import _ from 'lodash';
import MeetingTimeRepository from "../repositories/meetingTime";
import HttpException from "../exceptions/httpException";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import MeetingTime from "../entities/meetingTime";
import InvalidRequestException from "../exceptions/invalidRequestException";
import VoteService from "./vote";

export default class MeetingTimeService {
    private static service: MeetingTimeService;
    private readonly repository: MeetingTimeRepository;

    private constructor() {
        this.repository = getCustomRepository(MeetingTimeRepository);
    };

    public static getInstance() {
        if (!MeetingTimeService.service)
            MeetingTimeService.service = MeetingTimeService._getInstance();
        return MeetingTimeService.service;
    }

    private static _getInstance = (): MeetingTimeService => new MeetingTimeService();

    private _createMeetingTime = (meetingTime: { startsAt, endsAt }, pollId) => {
        const newMeetingTime = new MeetingTime();
        newMeetingTime.poll = pollId;
        newMeetingTime.startsAt = meetingTime.startsAt;
        newMeetingTime.endsAt = meetingTime.endsAt;
        newMeetingTime.votes = [];
        return newMeetingTime;
    };

    @Transactional()
    public async createMeetingTime(meetingTimes: { startsAt, endsAt } | Array<{ startsAt, endsAt }>, pollId) {
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
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    @Transactional()
    public async updateMeetingTime(pollId, meetingTimeId, meetingTime) {
        try {
            let meetingTimeInDB = await this.repository.findOne({
                where: {poll: pollId, id: meetingTimeId},
                select: ['id', 'startsAt', 'endsAt', 'voteFor', 'voteAgainst', 'selected']
            });
            if (meetingTimeInDB) {
                meetingTime = _.omit(meetingTime, ['id']);
                await this.repository.update(meetingTimeId, meetingTime);
                return _.assign(meetingTimeInDB, meetingTime);
            } else
                throw new ResourceNotFoundException(`Poll with id '${pollId}' not found meetingTime with id '${meetingTimeId}'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public getSelectedMeetingTime = async (pollId) => {
        try {
            let meetingTime = await this.repository.findOne({
                where: {poll: pollId, selected: true},
                select: ['startsAt', 'endsAt','id','selected']
            });
            if (meetingTime)
                return meetingTime;
            else
                throw new InvalidRequestException('There is no selected meeting time');
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    @Transactional()
    public async saveVote(meetingTime, vote) {
        try {
            if (meetingTime.votes.length > 0) {
                if (vote.voteFor !== meetingTime.votes[0].voteFor) {
                    if (vote.voteFor == 1) {
                        meetingTime.voteFor += 1;
                        if (meetingTime.votes[0].voteFor == -1)
                            meetingTime.voteAgainst -= 1;
                        else if (meetingTime.votes[0].voteFor == 0)
                            meetingTime.voteAbstain -=1;
                    } else if (vote.voteFor == -1){
                        meetingTime.voteAgainst += 1;
                        if (meetingTime.votes[0].voteFor == 1)
                            meetingTime.voteFor -= 1;
                        else if (meetingTime.votes[0].voteFor == 0)
                            meetingTime.voteAbstain -= 1;
                    } else if (vote.voteFor == 0) {
                        meetingTime.voteAbstain += 1;
                        if (meetingTime.votes[0].voteFor == 1)
                            meetingTime.voteFor -= 1;
                        else if (meetingTime.votes[0].voteFor == -1)
                            meetingTime.voteAgainst -= 1;
                    }
                    meetingTime.votes[0].voteFor = vote.voteFor;
                } else
                    return meetingTime;
            } else if (vote.voteFor == 1)
                meetingTime.voteFor += 1;
            else if (vote.voteFor == -1)
                meetingTime.voteAgainst += 1;
            else if (vote.voteFor == 0)
                meetingTime.voteAbstain +=1;
            const updatedMeetingTime = _.omit(meetingTime, ['id', 'votes']);
            await this.repository.update(meetingTime.id, updatedMeetingTime);
            const voteService = VoteService.getInstance();
            if (meetingTime.votes.length > 0)
                meetingTime.votes[0] = await voteService.updateVote(meetingTime.votes[0]);
            else
                meetingTime.votes[0] = await voteService.insertVote(vote);
            return meetingTime;
        } catch (ex) {
            console.log(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    //@Transactional()
    public removeMeetingTime = async (meetingTimeId) =>{
        try{
            let meetingTime = await this.repository.findOneThatWithMeetingTimeVote(meetingTimeId)
            if (meetingTime && !meetingTime.selected){
                await this.repository.delete(meetingTimeId)
                return meetingTime
            } else if (meetingTime.selected){
                throw new InvalidRequestException('Can not remove selected meetingTime');
            } else if(!meetingTime){
                throw new ResourceNotFoundException('There is no meeting time with this id')
            }
        }catch(ex){
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

}