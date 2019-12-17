import {getCustomRepository} from "typeorm";
import { Transactional } from "typeorm-transactional-cls-hooked";
import _ from 'lodash';
import HttpException from "../exceptions/httpException";
import VoteRepository from "../repositories/vote";
import Vote from "../entities/vote";


export default class VoteService {
    private static service: VoteService;
    private readonly repository: VoteRepository;

    private constructor() {
        this.repository = getCustomRepository(VoteRepository);
    };

    public static getInstance() {
        if (!VoteService.service)
            VoteService.service = VoteService._getInstance();
        return VoteService.service;
    }

    private static _getInstance = (): VoteService => new VoteService();

    @Transactional()
    public async insertVote(vote) {
        try {
            const newVote = new Vote();
            newVote.voteFor = vote.voteFor;
            newVote.meetingTime = vote.meetingTimeId;
            newVote.voter = vote.voter;
            await this.repository.insert(newVote);
            return _.pick(newVote, ['id', 'voteFor']);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async updateVote(vote) {
        try {
            const updatedVote = _.pick(vote, ['voteFor']);
            await this.repository.update(vote.id, updatedVote);
            return _.pick(vote, ['id', 'voteFor']);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}