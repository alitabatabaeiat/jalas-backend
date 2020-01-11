import {EntityRepository, Repository} from "typeorm";
import MeetingTime from "../entities/meetingTime";

@EntityRepository(MeetingTime)
export default class MeetingTimeRepository extends Repository<MeetingTime> {


    findOneThatWithMeetingTimeVote(meetingTimeId): Promise<MeetingTime | undefined> {
        return this.manager.createQueryBuilder(MeetingTime, 'meetingTime')
            .select(['meetingTime.id','meetingTime.selected',
                'vote.id', 'vote.voteFor', 'voter.id','voter.email'])
            .leftJoin('meetingTime.votes', 'vote')
            .leftJoin('vote.voter', 'voter')
            .where('meetingTime.id = :meetingTimeId')
            .setParameters({ meetingTimeId })
            .getOne();
    }

}