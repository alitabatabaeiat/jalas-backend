import {EntityRepository, Repository} from "typeorm";
import Vote from "../entities/vote";

@EntityRepository(Vote)
export default class VoteRepository extends Repository<Vote> {
}