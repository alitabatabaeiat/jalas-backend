import Controller from './controller';
import CommentService from '../services/comment';
import validationMiddleware from "../middlewares/validation";
import authMiddleware from "../middlewares/auth";
import {
    createCommentSchema,
    updateCommentSchema
} from '../validations/comment';
import {idSchema} from "../validations/common";

export default class CommentController extends Controller {
    constructor() {
        super('/comments');
    }

    protected initRouterMatches() {
        this.routerMatches = [{
            method: 'GET',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({
                query: idSchema('pollId')
            }), CommentController.getComments]
        },{
            method: 'POST',
            path: '/',
            handlers: [authMiddleware, validationMiddleware({
                body: createCommentSchema
            }), CommentController.createComment]
        }, {
            method: 'PATCH',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema(),
                body: updateCommentSchema
            }), CommentController.updateComment]
        }, {
            method: 'DELETE',
            path: '/:id',
            handlers: [authMiddleware, validationMiddleware({
                params: idSchema()
            }), CommentController.removeComment]
        }];
    };

    private static getComments = async (req, res) => {
        const {user, query} = req;
        const response = await CommentService.getInstance().getComments(user, query.pollId);
        res.send(response);
    };

    private static createComment = async (req, res) => {
        const {user, body} = req;
        const response = await CommentService.getInstance().createComment(user, body);
        res.send(response);
    };

    private static updateComment = async (req, res) => {
        const {user, params, body} = req;
        const response = await CommentService.getInstance().updateComment(user, params.id, body);
        res.send(response);
    };

    private static removeComment = async (req, res) => {
        const {user, params} = req;
        const response = await CommentService.getInstance().removeComment(user, params.id);
        res.send(response);
    };
}