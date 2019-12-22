import {EntityRepository, Repository} from "typeorm";
import Comment from "../entities/comment";

@EntityRepository(Comment)
export default class CommentRepository extends Repository<Comment> {
}