import {EntityManager, getCustomRepository, getManager} from "typeorm";
import {PollRepository} from "../repositories/poll";
import Poll from "../entities/poll";
import MeetingTime from "../entities/meetingTime";

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

    public createPoll = async (owner, poll: Poll) => {
        const newPoll = new Poll();
        newPoll.title = poll.title;
        newPoll.owner = owner;
        let pollInsertResult;
        getManager().transaction(async (manager: EntityManager) => {
            pollInsertResult = await this.repository.insert(newPoll, manager);

        });
        return pollInsertResult;
    }
}