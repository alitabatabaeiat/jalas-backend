import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";
import MeetingTime from "../entities/meetingTime";

@EntityRepository(MeetingTime)
export default class MeetingTimeRepository extends Repository<MeetingTime> {
}