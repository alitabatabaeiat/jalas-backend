import {getCustomRepository} from "typeorm";
import moment from "moment";
import _ from 'lodash';
import PollRepository from "../repositories/poll";
import Poll from "../entities/poll";
import MeetingTimeService from "./meetingTime";
import ResourceNotFoundException from "../exceptions/resourceNotFoundException";
import HttpException from "../exceptions/httpException";
import ReservationsService from "./reservation";
import {sendMail} from "../utilities/mail";
import QualityInUseService from "./qualityInUse";
import InvalidRequestException from "../exceptions/invalidRequestException";
import UserService from "./user";

export default class PollService {
    private static service: PollService;
    protected repository: PollRepository;

    private constructor() {
        this.repository = getCustomRepository(PollRepository);
    };

    public static getInstance() {
        if (!PollService.service)
            PollService.service = PollService._getInstance();
        return PollService.service;
    }

    private static _getInstance = (): PollService => new PollService();

    public createPoll = async (ownerEmail: string, poll) => {
        try {
            let newPoll = new Poll();
            newPoll.title = poll.title;
            newPoll.owner = await UserService.getInstance().getUser(ownerEmail);
            newPoll.participants = await Promise.all(poll.participants.map(async participant =>
                await UserService.getInstance().getUser(participant)
            ));
            await this.repository.manager.transaction(async entityManager => {
                await this.repository.insert(newPoll);
                newPoll.possibleMeetingTimes = await Promise.all(poll.possibleMeetingTimes.map(async possibleMeetingTime => {
                    const meetingTime = await MeetingTimeService.getInstance().createMeetingTime(possibleMeetingTime, newPoll.id);
                    return _.omit(meetingTime, ['updatedAt', 'createdAt']);
                }));
            });
            return newPoll;
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public getPolls = async (user) => {
        try {
            return await this.repository.find({
                where: {owner: user},
                order: {createdAt: 'DESC'},
                select: ["id", "owner", "room", "state", "title"]
            });
        } catch (ex) {
            throw new HttpException();
        }
    };

    public getPoll = async (user, pollId) => {
        let error;
        try {
            const poll = await this.repository.findOne({
                where: {owner: user, id: pollId},
                select: ["id", "owner", "room", "state", "title"],
                relations: ['possibleMeetingTimes', 'owner', 'participants']
            });
            if (poll) return poll;
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };

    public getAvailableRooms = async (user, pollId) => {
        let error;
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                const meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                return await ReservationsService.getInstance().getAvailableRooms(meetingTime.startsAt, meetingTime.endsAt);
            } else if (poll.state !== 1)
                error = new HttpException(401, 'Cannot get rooms for this poll');
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
        throw error;
    };

    public reserveRoom = async (user, pollId, {room}) => {
        let error, poll, meetingTime, result;
        try {
            poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                const result = await ReservationsService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                await this.repository.manager.transaction(async entityManager => {
                    await this.repository.update(pollId, {state: 3, room, roomRequestedAt: moment().toISOString()});
                    await QualityInUseService.getInstance().reserveRoom();
                    await QualityInUseService.getInstance().pollCreated(pollId);
                });
                this.sendRoomReservationUpdateMail(user, poll.title, room, true);
                return result;
            } else if (poll.state !== 1)
                error = new HttpException(401, 'Cannot reserve room for this poll');
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            if (ex instanceof HttpException) {
                // Reservation service unavailable
                if (ex.status === 503) {
                    await this.repository.update(pollId, {state: 2, room, roomRequestedAt: moment().toISOString()});
                    let interval = setInterval(async () => {
                        let status;
                        try {
                            await ReservationsService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                            status = 200;
                        } catch (ex) {
                            status = ex.status;
                        }
                        if (interval) {
                            if (status === 200) {
                                clearInterval(interval);
                                interval = null;
                                await this.repository.manager.transaction(async entityManager => {
                                    await this.repository.update(pollId, {state: 3});
                                    await QualityInUseService.getInstance().reserveRoom();
                                    await QualityInUseService.getInstance().pollCreated(pollId);
                                });
                                this.sendRoomReservationUpdateMail(user, poll.title, room, true);
                            } else if (status === 400) {
                                clearInterval(interval);
                                interval = null;
                                await this.repository.update(pollId, {state: 1, room: null, roomRequestedAt: null});
                                this.sendRoomReservationUpdateMail(user, poll.title, room, false);
                            }
                        }
                    }, 1000);
                }
                throw ex;
            }
            throw new HttpException();
        }
        throw error;
    };

    private sendRoomReservationUpdateMail = (owner, pollTitle, room, successful) => {
        sendMail({
            from: `Jalas <${process.env.EMAIL_ADDRESS}>`,
            to: owner,
            subject: `Reservation state changed(${pollTitle})`,
            text: `Room ${room} ${successful ? 'successfully reserved.' : 'is already reserved! Please try another room.'}`
        });
    };

    public selectMeetingTime = async (user, pollId, {meetingTimeId}) => {
        let error;
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 0) {
                await this.repository.manager.transaction(async entityManager => {
                    await this.repository.update(pollId, {state: 1});
                    await MeetingTimeService.getInstance().selectMeetingTime(pollId, meetingTimeId);
                    await QualityInUseService.getInstance().pollChanged(pollId);
                    await QualityInUseService.getInstance().userEntersPollPage(pollId);
                });
                return {meetingTimeId}
            } else if (poll.state !== 0)
                error = new InvalidRequestException('Meeting time was selected');
            else
                error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
        throw error;
    };

    public removePoll = async (user, pollId) => {
        let error;
        try {
            const poll = await this.repository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state < 3) {
                await this.repository.manager.transaction(async entityManager => {
                    await this.repository.delete(pollId);
                    await QualityInUseService.getInstance().pollChanged(pollId);
                });
                return;
            } else if (poll.state === 3)
                error = new HttpException(400, 'Poll cannot be removed');
            else error = new ResourceNotFoundException('Poll');
        } catch (ex) {
            throw new HttpException();
        }
        throw error;
    };
}