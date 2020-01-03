import {getCustomRepository} from "typeorm";
import {Transactional} from "typeorm-transactional-cls-hooked";
import _ from "lodash";
import CommentRepository from "../repositories/comment";
import HttpException from "../exceptions/httpException";
import Comment from "../entities/comment";
import winston from "winston";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";

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

    @Transactional()
    public async createComment(user, poll, text: string, replyTo?) {
        try {
            const comment = new Comment();
            comment.text = text;
            comment.writer = user;
            comment.poll = poll;
            if (replyTo) {
                const parentComment = await this.repository.findOne(replyTo);
                if (!parentComment)
                    throw new ResourceNotFoundException(`Comment with id '${replyTo} does not exist to reply to it`);
                comment.replyTo = replyTo;
            }
            await this.repository.insert(comment);
            return _.pick(comment, ['id', 'text', 'writer', 'replyTo']);
        } catch (ex) {
            winston.error(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }

    public async getComments(pollId: string) {
        try {
            const commentsAndReplies: any = await this.repository.findByPoll(pollId);
            console.log(commentsAndReplies)
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
}