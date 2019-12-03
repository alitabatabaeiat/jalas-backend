import {EntityRepository, Repository} from "typeorm";
import Poll from "../entities/poll";
import QualityInUse from "../entities/qualityInUse";

@EntityRepository(QualityInUse)
export default class QualityInUseRepository extends Repository<QualityInUse> {
}