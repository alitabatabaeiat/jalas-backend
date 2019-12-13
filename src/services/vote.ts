import {EntityManager, getManager} from "typeorm";
import _ from 'lodash';
import HttpException from "../exceptions/httpException";
import VoteRepository from "../repositories/vote";
import Vote from "../entities/vote";


export default class VoteService {
    private static service: VoteService;
    private mainRepository: VoteRepository;
    private repository: VoteRepository;

    private constructor() {
        this.mainRepository = getManager().getCustomRepository(VoteRepository);
    };

    public static getInstance(manager?: EntityManager) {
        if (!VoteService.service)
            VoteService.service = VoteService._getInstance();
        return VoteService.service._setManager(manager);
    }

    private static _getInstance = (): VoteService => new VoteService();

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(VoteRepository);
        return this;
    };

    public insertVote = async (vote) => {
        try {
            const newVote = new Vote();
            newVote.voteFor = vote.voteFor;
            newVote.meetingTime = vote.meetingTimeId;
            newVote.voter = vote.voterId;
            await this.repository.insert(newVote);
            return _.pick(newVote, ['id', 'voteFor']);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public updateVote = async (vote) => {
        try {
            const updatedVote = _.pick(vote, ['voteFor']);
            await this.repository.update(vote.id, updatedVote);
            return _.omit(vote, ['updatedAt', 'createdAt']);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };
}