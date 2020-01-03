import {EntityRepository, Repository} from "typeorm";
import Comment from "../entities/comment";

@EntityRepository(Comment)
export default class CommentRepository extends Repository<Comment> {
    async findByPoll(pollId: string): Promise<any[]> {
        const rawResult = await this.manager.query(
            `WITH RECURSIVE comments_and_replies AS (
                        SELECT
                            c.id,
                            c.text,
                            c.reply_to AS "replyTo",
                            u.id AS writer,
                            u.full_name AS "fullName",
                            u.email
                        FROM
                            comments c
                        LEFT JOIN users u ON u.id = user_id
                        WHERE
                            poll_id = $1 AND c.reply_to IS NULL
                        UNION
                            SELECT
                                c.id,
                                c.text,
                                c.reply_to AS "comment_replyTo",
                                u.id AS writer,
                                u.full_name AS "fullName",
                                u.email
                            FROM
                                comments c
                            INNER JOIN comments_and_replies cr ON cr.id = c.reply_to
                            LEFT JOIN users u ON u.id = user_id
                    ) SELECT
                        *
                    FROM
                        comments_and_replies;`,
            [pollId]
        );
        return rawResult.map(comment => Object.assign(comment, {
            replies: [],
            writer: {
                id: comment.writer,
                fullName: comment.fullName,
                email: comment.email
            },
            fullName: undefined,
            email: undefined
        }));
    }
}