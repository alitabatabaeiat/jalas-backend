import {getCustomRepository} from "typeorm";
import {Transactional} from "typeorm-transactional-cls-hooked";
import _ from "lodash";
import CommentRepository from "../repositories/comment";
import HttpException from "../exceptions/httpException";
import Comment from "../entities/comment";
import winston from "winston";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import PollService from "./poll";

export default class CommentService {
    private static service: CommentService;
    private readonly repository: CommentRepository;

    private constructor() {
        this.repository = getCustomRepository(CommentRepository);
    };

    public static getInstance() {
        if (!CommentService.service)
            CommentService.service = CommentService._getInstance();
        return CommentService.service;
    }

    private static _getInstance = (): CommentService => new CommentService();

    public async getComments(user, pollId) {
        try {
            const poll = await PollService.getInstance().getPoll(user, pollId);
            const commentsAndReplies: any = await this.repository.findByPoll(poll.id);
            const comments = _.keyBy(_.filter(commentsAndReplies, comment => !comment.replyTo), 'id');
            const replies = _.keyBy(_.filter(commentsAndReplies, comment => comment.replyTo), 'id');
            _.forEachRight(replies, reply => (comments[reply.replyTo] || replies[reply.replyTo]).replies.push(reply));
            return _.values(comments);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    @Transactional()
    public async createComment(user, comment) {
        try {
            const newComment = new Comment();
            newComment.text = comment.text;
            newComment.writer = user.id;
            newComment.poll = comment.pollId;
            if (comment.replyTo) {
                const parentComment = await this.repository.findOne(comment.replyTo);
                if (!parentComment)
                    throw new ResourceNotFoundException(`Comment with id '${comment.replyTo} does not exist to reply to it`);
                newComment.replyTo = comment.replyTo;
            }
            await this.repository.insert(newComment);
            return _.pick(newComment, ['id', 'text', 'writer', 'replyTo']);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async updateComment(user, id: string, {text}) {
        try {
            const comment = await this.repository.findOne(id, {
                loadRelationIds: {
                    relations: ['writer']
                }
            });
            if (comment && comment.writer === user.id) {
                await this.repository.update(comment.id, {text});
                comment.text = text;
                return _.pick(comment, ['id', 'text', 'writer', 'replyTo']);
            }
            else if (!comment)
                throw new ResourceNotFoundException('Comment', 'id', id);
            else if (comment.writer !== user.id)
                throw new HttpException(400, `You don't have permission to update this comment`);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async removeComment(user, id: string) {
        try {
            const comment = await this.repository.findOne(id, {
                loadRelationIds: {
                    relations: ['writer', 'poll']
                }
            });
            if (comment) {
                if (comment.writer === user.id)
                    await this.repository.delete(comment.id);
                else {
                    const poll = await PollService.getInstance().getPoll(user, comment.poll);
                    if (poll && poll.owner.id === user.id)
                        await this.repository.delete(comment.id);
                    else
                        throw new HttpException(400, `You don't have permission to remove this comment`);
                }
            } else if (!comment)
                throw new ResourceNotFoundException('Comment', 'id', id);
            return 'Comment removed successfully';
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}