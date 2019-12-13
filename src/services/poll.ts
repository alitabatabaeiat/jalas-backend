import {EntityManager, getManager} from "typeorm";
import moment from "moment";
import _ from "lodash";
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
    private mainRepository: PollRepository;
    private repository: PollRepository;

    private constructor() {
        this.mainRepository = getManager().getCustomRepository(PollRepository);
    };

    public static getInstance(manager?: EntityManager) {
        if (!PollService.service)
            PollService.service = PollService._getInstance();
        return PollService.service._setManager(manager);
    }

    private static _getInstance = (): PollService => new PollService();

    private _setManager = (manager: EntityManager = getManager()) => {
        this.repository = manager.getCustomRepository(PollRepository);
        return this;
    };

    public createPoll = async (ownerEmail: string, poll) => {
        try {
            let newPoll = new Poll();
            newPoll.title = poll.title;
            newPoll.owner = await UserService.getInstance().getUser(ownerEmail);
            newPoll.participants = await Promise.all(poll.participants.map(async participant =>
                await UserService.getInstance().getUser(participant)
            ));
            await getManager().transaction(async entityManager => {
                await this._setManager(entityManager).repository.save(newPoll);
                newPoll.possibleMeetingTimes = await MeetingTimeService.getInstance(entityManager)
                    .createMeetingTime(poll.possibleMeetingTimes, newPoll.id);
            });
            return newPoll;
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public getPolls = async (userEmail: string) => {
        try {
            const user = await UserService.getInstance().getUser(userEmail);
            return await this.mainRepository.find({
                where: {owner: user},
                order: {createdAt: 'DESC'},
                select: ["id", "owner", "room", "state", "title"]
            });
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public getPoll = async (userEmail: string, pollId: string) => {
        try {
            const poll = await this.mainRepository.findOneThatUserParticipateOnIt(pollId, userEmail);
            if (poll && poll.owner.email === userEmail) {
                poll.possibleMeetingTimes.forEach(meetingTime =>
                    _.remove(meetingTime.votes, vote => {
                        const mustRemove = !vote.voter;
                        delete vote.voter;
                        return mustRemove
                    })
                );
                return poll;
            } else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public getAvailableRooms = async (userEmail: string, pollId: string) => {
        try {
            const user = await UserService.getInstance().getUser(userEmail);
            const poll = await this.mainRepository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                const meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                return await ReservationsService.getInstance().getAvailableRooms(meetingTime.startsAt, meetingTime.endsAt);
            } else if (poll.state !== 1)
                throw new InvalidRequestException('First you must select a meeting time');
            else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public reserveRoom = async (userEmail: string, pollId: string, {room}) => {
        let user, poll, meetingTime;
        try {
            user = await UserService.getInstance().getUser(userEmail);
            poll = await this.mainRepository.findOne({where: {owner: user, id: pollId}});
            if (poll && poll.state === 1) {
                meetingTime = await MeetingTimeService.getInstance().getSelectedMeetingTime(pollId);
                const result = await ReservationsService.getInstance().reserveRoom(room, user, meetingTime.startsAt, meetingTime.endsAt);
                await getManager().transaction(async entityManager => {
                    await this._setManager(entityManager).repository.update(pollId, {
                        state: 3,
                        room,
                        roomRequestedAt: moment().toISOString()
                    });
                    const qualityInUseService = QualityInUseService.getInstance(entityManager);
                    await qualityInUseService.reserveRoom();
                    await qualityInUseService.pollCreated(pollId);
                    throw new HttpException(503);
                });
                this.sendRoomReservationUpdateMail(user.email, poll.title, room, true);
                return result;
            } else if (poll.state !== 1)
                throw new InvalidRequestException('First you must select a meeting time');
            else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            if (ex instanceof HttpException) {
                // Reservation service unavailable
                if (ex.status === 503) {
                    await this.mainRepository.update(pollId, {state: 2, room, roomRequestedAt: moment().toISOString()});
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
                                await getManager().transaction(async entityManager => {
                                    await this._setManager(entityManager).repository.update(pollId, {state: 3});
                                    const qualityInUseService = QualityInUseService.getInstance(entityManager);
                                    await qualityInUseService.reserveRoom();
                                    await qualityInUseService.pollCreated(pollId);
                                });
                                this.sendRoomReservationUpdateMail(user.email, poll.title, room, true);
                            } else if (status === 400) {
                                clearInterval(interval);
                                interval = null;
                                await this.mainRepository.update(pollId, {state: 1, room: null, roomRequestedAt: null});
                                this.sendRoomReservationUpdateMail(user.email, poll.title, room, false);
                            }
                        }
                    }, 1000);
                }
                throw ex;
            }
            throw new HttpException();
        }
    };

    private sendRoomReservationUpdateMail = (owner, pollTitle, room, successful) => {
        sendMail({
            from: `Jalas <${process.env.EMAIL_ADDRESS}>`,
            to: owner,
            subject: `Reservation state changed(${pollTitle})`,
            text: `Room ${room} ${successful ? 'successfully reserved.' : 'is already reserved! Please try another room.'}`
        });
    };

    public selectMeetingTime = async (userEmail: string, pollId: string, {meetingTime}) => {
        if (!meetingTime.selected)
            throw new InvalidRequestException('You cannot deselect meeting time');
        try {
            const user = await UserService.getInstance().getUser(userEmail);
            const poll = await this.mainRepository.findOne({where: {owner: user, id: pollId}});
            if (poll) {
                if (poll.state === 0) {
                    let updatedMeetingTime = null;
                    await getManager().transaction(async entityManager => {
                        await this._setManager(entityManager).repository.update(pollId, {state: 1});
                        const qualityInUseService = QualityInUseService.getInstance(entityManager);
                        updatedMeetingTime = await MeetingTimeService.getInstance(entityManager).updateMeetingTime(pollId, meetingTime.id, meetingTime);
                        await qualityInUseService.pollChanged(pollId);
                        await qualityInUseService.userEntersPollPage(pollId);
                    });
                    return updatedMeetingTime;
                } else
                    throw new InvalidRequestException('Poll already has a meeting time');
            } else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public voteMeetingTime = async (userEmail: string, pollId: string, {vote}) => {
        try {
            const poll = await this.mainRepository.findOneThatUserParticipateOnItWithMeetingTimeVote(pollId, userEmail, vote.meetingTimeId);
            if (poll && poll.state === 0 && (poll.owner || poll.participants.length > 0) && poll.possibleMeetingTimes.length > 0) {
                _.remove(poll.possibleMeetingTimes[0].votes, vote => !vote.voter);
                poll.possibleMeetingTimes[0].votes.forEach(vote => delete vote.voter);
                vote.voter = poll.owner || poll.participants[0];
                return await MeetingTimeService.getInstance().saveVote(poll.possibleMeetingTimes[0], vote);
            } else if (!poll)
                throw new ResourceNotFoundException('Poll');
            else if (poll.state > 0)
                throw new InvalidRequestException('A meeting time has been set for poll');
            else if (!(poll.owner || poll.participants.length > 0))
                throw new InvalidRequestException(`You're not owner or a participant of poll`);
            else if (poll.possibleMeetingTimes.length === 0)
                throw new InvalidRequestException(`There is no meetingTime with id '${vote.meetingTimeId}' for poll`);
        } catch (ex) {
            console.log(ex);
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };

    public removePoll = async (userEmail: string, pollId: string) => {
        try {
            const user = await UserService.getInstance().getUser(userEmail);
            const poll = await this.mainRepository.findOne({where: {owner: user, id: pollId}});
            if (poll) {
                if (poll.state < 3) {
                    await getManager().transaction(async entityManager => {
                        await this._setManager(entityManager).repository.delete(pollId);
                        await QualityInUseService.getInstance(entityManager).pollChanged(pollId);
                    });
                    return;
                } else
                    throw new InvalidRequestException('Poll cannot be removed');
            } else
                throw new ResourceNotFoundException(`You don't have any poll with id '${pollId}'`);
        } catch (ex) {
            if (ex instanceof HttpException)
                throw ex;
            throw new HttpException();
        }
    };
}