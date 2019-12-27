import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";

@EntityRepository(Poll)
export default class PollRepository extends Repository<Poll> {
    findOneThatUserParticipateOnIt(id, userEmail): Promise<Poll | undefined> {
        return this.manager.createQueryBuilder(Poll, 'poll')
            .select(['poll.id', 'poll.title', 'poll.room', 'poll.state', 'owner.id', 'owner.email', 'participant.id', 'participant.email', 'meetingTime.id',
                'meetingTime.voteFor', 'meetingTime.voteAgainst', 'meetingTime.startsAt', 'meetingTime.endsAt', 'meetingTime.selected',
                'vote.id', 'vote.voteFor', 'voter.id','comment.id','comment.text','writer.id'])
            .leftJoin('poll.owner', 'owner')
            .leftJoin('poll.participants', 'participant')
            .leftJoin('poll.possibleMeetingTimes', 'meetingTime')
            .leftJoin('meetingTime.votes', 'vote')
            .leftJoin('vote.voter', 'voter', 'voter.email = :userEmail')
            .leftJoin('poll.comments', 'comment')
            .leftJoin('comment.writer','writer','writer.email = :userEmail')
            .where('poll.id = :id')
            .setParameters({id, userEmail})
            .getOne();
    }

    findOneThatUserParticipateOnItWithMeetingTimeVote(id, userEmail, meetingTimeId): Promise<Poll | undefined> {
        return this.manager.createQueryBuilder(Poll, 'poll')
            .select(['poll.id', 'poll.state', 'owner.id', 'owner.email', 'participant.id', 'participant.email', 'meetingTime.id',
                'meetingTime.voteFor', 'meetingTime.voteAgainst', 'meetingTime.startsAt', 'meetingTime.endsAt', 'meetingTime.selected',
                'vote.id', 'vote.voteFor', 'voter.id','comment.id','comment.text','writer.id'])
            .leftJoin('poll.owner', 'owner', 'owner.email = :userEmail',)
            .leftJoin('poll.participants', 'participant', 'participant.email = :userEmail')
            .leftJoin('poll.possibleMeetingTimes', 'meetingTime', 'meetingTime.id = :meetingTimeId')
            .leftJoin('meetingTime.votes', 'vote')
            .leftJoin('vote.voter', 'voter', 'voter.email = :userEmail')
            .leftJoin('poll.comments', 'comment')
            .leftJoin('comment.writer', 'writer', 'writer.email = :userEmail')
            .where('poll.id = :id')
            .setParameters({id, userEmail, meetingTimeId})
            .getOne();
    }
}