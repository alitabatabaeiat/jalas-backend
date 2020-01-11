import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";

@EntityRepository(Poll)
export default class PollRepository extends Repository<Poll> {
    findThatUserParticipates(idOrUserId: string, userId?: string): Promise<Poll |  Poll[] | undefined> {
        const id = userId ? idOrUserId : null;
        userId = userId || idOrUserId;
        const query = this.manager.createQueryBuilder(Poll, 'poll')
            .select(['poll.id', 'poll.title', 'poll.room', 'poll.state', 'owner.id'])
            .leftJoin('poll.owner', 'owner')
            .leftJoin('poll.participants', 'participant', 'participant.id = :userId')
            .where('(owner.id = :userId OR participant.id = :userId)')
            .setParameter('userId', userId);
            if (id)
                return query.andWhere('poll.id = :pollId')
                    .setParameter('pollId', id)
                    .getOne();
            return query.getMany();
    }

    findOneThatUserParticipatesWithRelations(id, userEmail): Promise<Poll | undefined> {
        return this.manager.createQueryBuilder(Poll, 'poll')
            .select(['poll.id', 'poll.title', 'poll.room', 'poll.state', 'owner.id', 'owner.email', 'participant.id', 'participant.email', 'meetingTime.id',
                'meetingTime.voteFor', 'meetingTime.voteAgainst','meetingTime.voteAbstain', 'meetingTime.startsAt', 'meetingTime.endsAt', 'meetingTime.selected',
                'vote.id', 'vote.voteFor', 'voter.id'])
            .leftJoin('poll.owner', 'owner')
            .leftJoin('poll.participants', 'participant')
            .leftJoin('poll.possibleMeetingTimes', 'meetingTime')
            .leftJoin('meetingTime.votes', 'vote')
            .leftJoin('vote.voter', 'voter', 'voter.email = :userEmail')
            .where('poll.id = :id')
            .andWhere('(owner.email = :userEmail OR participant.email = :userEmail)')
            .setParameters({id, userEmail})
            .getOne();
    }

    findOneThatUserParticipateOnItWithMeetingTimeVote(id, userEmail, meetingTimeId): Promise<Poll | undefined> {
        return this.manager.createQueryBuilder(Poll, 'poll')
            .select(['poll.id', 'poll.title' , 'poll.state', 'owner.id', 'owner.email', 'participant.id', 'participant.email', 'meetingTime.id',
                'meetingTime.voteFor', 'meetingTime.voteAgainst','meetingTime.voteAbstain', 'meetingTime.startsAt', 'meetingTime.endsAt', 'meetingTime.selected',
                'vote.id', 'vote.voteFor', 'voter.id'])
            .leftJoin('poll.owner', 'owner')
            .leftJoin('poll.participants', 'participant', 'participant.email = :userEmail')
            .leftJoin('poll.possibleMeetingTimes', 'meetingTime', 'meetingTime.id = :meetingTimeId')
            .leftJoin('meetingTime.votes', 'vote')
            .leftJoin('vote.voter', 'voter', 'voter.email = :userEmail')
            .leftJoin('poll.comments', 'comment')
            .leftJoin('comment.writer', 'writer', 'writer.email = :userEmail')
            .where('poll.id = :id')
            .andWhere('(owner.email = :userEmail OR participant.email = :userEmail)')
            .setParameters({id, userEmail, meetingTimeId})
            .getOne();
    }
}