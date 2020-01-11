import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";
import QualityInUse from "../entities/qualityInUse";

@EntityRepository(QualityInUse)
export default class QualityInUseRepository extends Repository<QualityInUse> {
    public async countChangedPolls() {
        return this.createQueryBuilder()
            .where({title: 'pollChanged'})
            .select('COUNT(id)').getRawOne();
    }

    public async averageCreationTime() {
        return this.createQueryBuilder()
            .where(`title = 'pollCreationTime' AND column2 ~ '^[0-9]*$'`)
            .select('AVG(column2::INTEGER)').getRawOne()
    }
}