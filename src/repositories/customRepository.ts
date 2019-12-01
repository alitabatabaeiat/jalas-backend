import {AbstractRepository, EntityManager, EntityRepository, InsertResult, ObjectLiteral, Repository} from "typeorm";
import Poll from "../entities/poll";
import {QueryDeepPartialEntity} from "typeorm/query-builder/QueryPartialEntity";


export class CustomRepository<Entity extends ObjectLiteral> extends AbstractRepository<Entity> {
    insert(entity: QueryDeepPartialEntity<Entity> | (QueryDeepPartialEntity<Entity>[]), entityManager: EntityManager = this.manager): Promise<InsertResult> {
        return entityManager.insert(Poll, entity);
    }
}