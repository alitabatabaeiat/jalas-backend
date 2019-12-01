import {EntityManager, EntityRepository, InsertResult, Repository} from "typeorm";
import Poll from "../entities/poll";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";
import {CustomRepository} from "./customRepository";

@EntityRepository(Poll)
export class PollRepository extends CustomRepository<Poll> {
}