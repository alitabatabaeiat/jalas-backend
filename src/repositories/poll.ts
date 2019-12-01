import {AbstractRepository, EntityManager, EntityRepository, InsertResult, Repository} from "typeorm";
import Poll from "../entities/poll";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";

@EntityRepository(Poll)
export class PollRepository extends AbstractRepository<Poll> {
    insert(entity: QueryDeepPartialEntity<Poll> | (QueryDeepPartialEntity<Poll>[]), entityManager: EntityManager = this.manager): Promise<InsertResult> {
        return this.manager.insert(Poll, entity);
    }
}