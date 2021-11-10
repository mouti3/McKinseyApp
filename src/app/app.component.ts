import { Component, OnInit } from '@angular/core';
import { GapService } from './gap.service';
import { LevelMc } from './models/LevelMc';
import * as _ from 'lodash';
import { Gap, ParkingType } from './models/Gap';
import { values } from 'lodash';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public allLevelData: LevelMc[] = [];

  constructor(private gapService: GapService) {}

  ngOnInit(): void {
    try {
      setInterval(async () => {
        this.loadParkingData();
      }, 5000);
    } catch(e) {
      console.log(e);
    }

  }

     loadParkingData() {
      let fixedGaps =  this.gapService.fixedGaps;
      let greenSlots: any = [];
       this.gapService.getFixedGaps().subscribe((groupGaps) => {
         groupGaps.then((data) => {
          data.subscribe((dataTwo) => {
            dataTwo.then((dataThree) => dataThree.subscribe((dataFour) => {

              fixedGaps = this.gapService.getFixedGapsInsideGroup();
              this.gapService.getLiveStatus().subscribe(value => {
               
            fixedGaps = value?.gaps?.fixedGaps!;
        _.forEach(fixedGaps, (gap: Gap) => {
          // priority: hidden -> predicted -> offline -> other custom states -> occupied
          // custom state check
          if (gap.customState && gap.customState !== 'reserved') {
            // skip hidden
            if (gap.customState !== 'hidden') {
              // setting predicted state
              if (gap.offline && gap.customState === 'ignore') {
                if (gap.predictedState) {
                  gap.fillColor = gap.predictedState === 'free' ? '#c5d72f' : '#c63b23';
                }
                // greySlots.push(gap);
              } else if (gap.offline) {
                // greySlots.push(gap);
              } else if (gap.customState === 'ignore') {
                if (gap.offline) {
                  // greySlots.push(gap);
                } else if (gap.occupied && gap.rawDatas!.length) {
                  // check for double places usage
                  // if (!this.areaInfo || !this.areaInfo.doublePlaces) {
                  //   redSlots.push(gap);
                  // } else {
                  //   if (gap.reference.split(',').length > 1 && gap.rawDatas.length === 1) {
                  //     yellowSlots.push(gap);
                  //   } else {
                  //     redSlots.push(gap);
                  //   }
                  // }
                } else {
                  greenSlots.push(gap);
                }
              } else if (gap.customState === 'occupied') {
                // redSlots.push(gap);
              } else {
                greenSlots.push(gap);
              }
            }
          } else {
            if (gap.offline) {
              // setting predicted state
              // if (this.areaInfo && this.areaInfo.showPredictedState && gap.predictedState) {
              //   gap.fillColor = gap.predictedState === 'free' ? '#c5d72f' : '#c63b23';
              // }
              // greySlots.push(gap);
            } else if (gap.occupied && gap.rawDatas!.length) {
              // check for double places usage
              // if (!this.areaInfo || !this.areaInfo.doublePlaces) {
              //   if (_.last(gap.rawDatas).parkingPurchasedDate && _.last(gap.rawDatas).parkingExpired) {
              //     gap.showFrame = true;
              //     gap.frameColor = '#82121b';
              //   } else if (_.last(gap.rawDatas).parkingExpired) {
              //     gap.showFrame = true;
              //     gap.frameColor = '#ff913d';
              //   }
              //   redSlots.push(gap);
              // } else {
              //   if (gap.reference.split(',').length > 1 && gap.rawDatas.length === 1) {
              //     yellowSlots.push(gap);
              //   } else {
              //     if (_.last(gap.rawDatas).parkingExpired) {
              //       gap.showFrame = true;
              //       gap.frameColor = 'orange';
              //     }
              //     redSlots.push(gap);
              //   }
              // }
            } else {
              greenSlots.push(gap);
            }
            if (gap.customState === 'reserved') {
              gap.showFrame = true;
              gap.frameColor = '#1b87cf';
              gap.strokeWeight = 1;
            }
          }
          if (gap.parkingType) {
            gap.showFrame = true;
            switch (gap.parkingType as ParkingType) {
              case ParkingType.BB:
                gap.frameColor = 'blue';
                break;
              case ParkingType.ST:
                gap.frameColor = 'grey';
                break;
              case ParkingType.PR:
                gap.frameColor = 'gold';
                break;
              case ParkingType.SE:
                gap.frameColor = 'purple';
                break;
              case ParkingType.PD:
                gap.frameColor = 'pink';
                break;
              case ParkingType.EV:
                gap.frameColor = 'yellow';
                break;
              case ParkingType.TR:
                gap.frameColor = 'black';
                break;
              case ParkingType.SP:
                gap.frameColor = 'orange';
                break;
              case ParkingType.TP:
                gap.frameColor = 'darkgreen';
                break;
            }
          }
        });
        let allData: LevelMc[] = [];
        let level2 = new LevelMc("Level-2",0,0,0);
        let level2A = new LevelMc("Level-2A",0,0,0);
        let level3 = new LevelMc("Level-3",0,0,0);
        let level3A = new LevelMc("Level-3A",0,0,0);
        let level4 = new LevelMc("Level-4",0,0,0);
        let level4A = new LevelMc("Level-4A",0,0,0);
        
        //set Level2 Values
        const allLevel2Values = _.filter(greenSlots, (fg) => fg.level === -1);
        level2.standardPk = _.filter(allLevel2Values, (g) => g.garageParkingType[0] === "ST").length;
        level2.handicappedPk = _.filter(allLevel2Values, (g) => g.garageParkingType[0] === "HC").length;
        level2.eChargedPk = _.filter(allLevel2Values, (g) => g.garageParkingType[0] === "EC").length;
        allData.push(level2);

          //set Level2A Values
          const allLevel2AValues = _.filter(greenSlots, (fg) => fg.level === -2);
          level2A.standardPk = _.filter(allLevel2AValues, (g) => g.garageParkingType[0] === "ST").length;
          level2A.handicappedPk = _.filter(allLevel2AValues, (g) => g.garageParkingType[0] === "HC").length;
          level2A.eChargedPk = _.filter(allLevel2AValues, (g) => g.garageParkingType[0] === "EC").length;
          allData.push(level2A);

            //set Level3 Values
            const allLevel3Values = _.filter(greenSlots, (fg) => fg.level === -3);
            level3.standardPk = _.filter(allLevel3Values, (g) => g.garageParkingType[0] === "ST").length;
            level3.handicappedPk = _.filter(allLevel3Values, (g) => g.garageParkingType[0] === "HC").length;
            level3.eChargedPk = _.filter(allLevel3Values, (g) => g.garageParkingType[0] === "EC").length;
            allData.push(level3);

              //set Level3A Values
          const allLevel3AValues = _.filter(greenSlots, (fg) => fg.level === -4);
          level3A.standardPk = _.filter(allLevel3AValues, (g) => g.garageParkingType[0] === "ST").length;
          level3A.handicappedPk = _.filter(allLevel3AValues, (g) => g.garageParkingType[0] === "HC").length;
          level3A.eChargedPk = _.filter(allLevel3AValues, (g) => g.garageParkingType[0] === "EC").length;
          allData.push(level3A);

            //set Level4 Values
            const allLevel4Values = _.filter(greenSlots, (fg) => fg.level === -5);
            level4.standardPk = _.filter(allLevel4Values, (g) => g.garageParkingType[0] === "ST").length;
            level4.handicappedPk = _.filter(allLevel4Values, (g) => g.garageParkingType[0] === "HC").length;
            level4.eChargedPk = _.filter(allLevel4Values, (g) => g.garageParkingType[0] === "EC").length;
            allData.push(level4);

              //set Level4A Values
          const allLevel4AValues = _.filter(greenSlots, (fg) => fg.level === -6);
          level4A.standardPk = _.filter(allLevel4AValues, (g) => g.garageParkingType[0] === "ST").length;
          level4A.handicappedPk = _.filter(allLevel4AValues, (g) => g.garageParkingType[0] === "HC").length;
          level4A.eChargedPk = _.filter(allLevel4AValues, (g) => g.garageParkingType[0] === "EC").length;
          allData.push(level4A);


          this.allLevelData = allData;
              })


            }));
          })
         })
       });
   
  } 
  
}
