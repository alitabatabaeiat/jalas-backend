import {EntityManager, getRepository, Repository} from "typeorm";
import Poll from "../entities/poll";
import HttpException from "../exceptions/httpException";

export default class PollService {
    private static service: PollService;
    protected repository: Repository<Poll>;

    private constructor() {
        this.repository = getRepository(Poll);
    };

    public static getInstance() {
        if (!PollService.service)
            PollService.service = PollService._getInstance();
        return PollService.service;
    }

    private static _getInstance = () : PollService => new PollService();

    public createPoll = async (poll, entityManager: EntityManager = this.repository.manager) => {
    }
}