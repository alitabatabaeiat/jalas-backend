import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";

@EntityRepository(Poll)
export default class PollRepository extends Repository<Poll> {
}