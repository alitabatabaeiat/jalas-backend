import {EntityManager, getCustomRepository, getRepository, Repository} from "typeorm";
import Poll from "../entities/poll";
import HttpException from "../exceptions/httpException";
import {PollRepository} from "../repositories/poll";

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

    private static _getInstance = () : PollService => new PollService();

    public createPoll = async (poll, entityManager: EntityManager) => {

    }
}