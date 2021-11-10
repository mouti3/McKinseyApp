export class LevelMc {
    levelName: string;
    standardPk: number;
    eChargedPk: number;
    handicappedPk: number;

    constructor(levelName: string, standardPk: number, eChargedPk: number,handicappedPk: number) {
        this.levelName = levelName;
        this.standardPk = standardPk;
        this.eChargedPk = eChargedPk;
        this.handicappedPk = handicappedPk;
    }
}