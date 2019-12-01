import {AbstractRepository, EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";

@EntityRepository(Poll)
export class PollRepository extends AbstractRepository<Poll> {
}