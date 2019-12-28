import { getCustomRepository } from "typeorm";
import { Transactional } from "typeorm-transactional-cls-hooked";
import _ from "lodash";
import CommentRepository from "../repositories/comment";
import HttpException from "../exceptions/httpException";
import Comment from "../entities/comment";

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
    public async createComment(user, poll, text: string) {
        try {
            const comment = new Comment();
            comment.text = text;
            comment.writer = user;
            comment.poll = poll;
            await this.repository.insert(comment);
            return _.pick(comment, ['id', 'text', 'writer']);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    }
}