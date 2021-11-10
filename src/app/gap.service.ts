import { Injectable } from '@angular/core';
import { AreaInfo, WidgetStatusEnum } from './models/AreaInfo';
import { AccessGap, BubbleGap, Gap, LosGap, ParkingType } from './models/Gap';
import * as _ from 'lodash';
import { Slot } from './models/Sensor';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class GapService {

  headers = {
    'Content-Type': 'application/json',
    'X-ApiKey': 'd1858b3c-2cab-45a1-8381-dfe7854a26c0',
};
userId = "21381cb90f534d439e61b25c3995395a";

accessGap: AccessGap = {
    ax: 50.8413198258328,
    ay: 4.35963562055089,
    bounds: { east: 4.36122617049672, west: 4.35963562055089, south: 50.8405169884122, north: 50.8413198258328 },
    bx: 50.8406321642495,
    by: 4.35973486228444,
    center: [50.84092581887749, 4.36037803771396],
    changedGaps: false,
    cx: 50.8405169884122,
    cy: 4.36114838643529,
    dx: 50.8413130508913,
    dy: 4.36122617049672,
    gapid: "036655bd-7536-406d-96f5-02b987da7a5e",
    level: 0,
    lowDetection: false,
    name: "McKinsey - Rue Brederode",
    noDetection: false,
    path: [
        { lat: 50.8413198258328, lng: 4.35963562055089 },
        { lat: 50.8406321642495, lng: 4.35973486228444 },
        { lat: 50.8405169884122, lng: 4.36114838643529 },
        { lat: 50.8413130508913, lng: 4.36122617049672 },
    ],
    reference: "",
    stampsEnabled: false,
    verticalFloats: true,
    viewid: "7d635012-a3a6-4f7b-b8e0-e8a8fef1b1f6",
    writeable: true,
    fillColor: "",
    customState: "",
    customStateUsage: undefined,
}

areaInfo: AreaInfo = {
  accessGapId: "036655bd-7536-406d-96f5-02b987da7a5e",
areaDisabled: false,
circWidgetStatus: 0,
detectionType: 0,
disableLiveLengthOfStay: false,
disableStatisticsFakeing: false,
displayesWidgetStatus: 0,
doNotAllowClientServiceRequest: false,
doublePlaces: false,
enableStatisticsViews: false,
groupsSettings: [],
hasTagSystem: true,
hideFixedGapsWithoutRawdataRef: false,
imagesForLevel: [],
liveViewWidgetStatus: 0,
mainGroupId: "mck",
manualChangesWidgetStatus: 0,
minimal15MinutesOccupancy: false,
networkWidgetStatus: 0,
occupancyStatisticValues: {filter: 3, minimum: 150},
occupancyWidgetStatus: 0,
onsiteTestingWidgetStatus: 0,
operationsWidgetStatus: 0,
reportOfflineSenosrsMinTime: 120,
reportsWidgetStatus: 0,
sensorsStatusWidgetStatus: 0,
sensorsWidgetStatus: 0,
serversStatusWidgetStatus: 0,
showInEnforcement: false,
showPredictedState: false,
statisticsWidgetStatus: 0,
subGroupId: "mck-bru",
systemPerformanceWidgetStatus: 0,
timeZone: 1,
}

groupGaps: Gap[] = [];

statisticViews: {
    gaps: Gap[];
    name: string;
    id: string;
    gapid: string;
    isView: boolean;
    bounds: any;
    center: number[];
  }[] = [];

  areaInfos: AreaInfo[] = [];
  bubbleGaps: BubbleGap[] = [];
  losGaps: LosGap[] =[];
  fixedGaps: Gap[] =[];

  floatingGaps: Gap[] = [];



constructor(private http: HttpClient) {

}

public getFixedGaps() {
    const params = this.getCoordinatesStringFromAccessGap() + '&type=Grouping&userid=' + this.userId;
          return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers }).pipe(
            map((res) => this.saveGroupGaps(<any>res)),
            catchError((err) => this.handleError(err))
          );
    

}

public getLiveStatus() {
    const gaps = {
      fixedGaps: this.fixedGaps,
       floatingGaps: this.floatingGaps
    } 

    let viewIds = this.getFixedGapsViewIdInsideGroup(this.accessGap);
const floatingIds = this.getFloatingGapsViewIdInsideGroup(this.accessGap);
if (!viewIds && floatingIds) {
  viewIds = floatingIds;
} else if (floatingIds) {
  viewIds = viewIds + ',' + floatingIds;
}
if (viewIds) {
  let stamps = false;
  if (this.accessGap.stampsEnabled) {
    stamps = true;
  }
  const params = this.getCoordinatesStringFromGap(this.accessGap) +
    '&userid=' +
    this.userId +
    '&viewids=' +
    viewIds +
    '&uselivedata=true&mintime=0&enableStamp=' +
    stamps +
    '&detail=0&designmode=' +
    false;
        return this.http.get('https://query-anker.cleverciti.com/ccs/city/query/area?' + params, { headers: this.headers }).pipe(
          map((res) => this.parseLiveStatusResponse(res, gaps, this.areaInfo)),
          catchError((err) => this.handleError(err))
        );
  

} else {
  console.error("error");
  return this.handleError('now view ids');
}

}


private parseLiveStatusResponse(response:any, gaps?: { fixedGaps?: Gap[]; floatingGaps?: Gap[] }, areaInfo?: AreaInfo) {
  const responseFromServer = this.extractDataLiveStatus(response);

  if (!responseFromServer) {
    return null;
  }
  const allOccupied = _.flatten(_.map(responseFromServer.slots, (slot:any) => slot.occupied));
  if (
    (!gaps || !gaps.fixedGaps || !gaps.fixedGaps.length) &&
    (!gaps || !gaps.floatingGaps || !gaps.floatingGaps.length)
  ) {
    return {
      customStates: responseFromServer.customState,
      rawData: _.flatten(
        _.map(allOccupied, (occ:any) => {
          const rawDatas: any[] = [];
          let paidBy = '';
          if (occ.paymentData) {
            if (occ.paymentData.length > 1) {
              paidBy = 'DP';
            } else if (occ.paymentData.length === 1) {
              if (occ.paymentData[0].data) {
                if (occ.paymentData[0].data.Provider === 'IPS') {
                  paidBy = 'IPS';
                } else if (occ.paymentData[0].data.Provider === 'PayByPhone') {
                  paidBy = 'PHONE';
                }
              }
            }
          }

          const rawDataAsGap = new Gap();
          rawDataAsGap.path = [
            { lat: occ.RawData[0].ax, lng: occ.RawData[0].ay },
            { lat: occ.RawData[0].bx, lng: occ.RawData[0].by },
            { lat: occ.RawData[0].cx, lng: occ.RawData[0].cy },
            { lat: occ.RawData[0].dx, lng: occ.RawData[0].dy },
          ];
          rawDataAsGap.ax = occ.RawData[0].ax;
          rawDataAsGap.ay = occ.RawData[0].ay;
          rawDataAsGap.bx = occ.RawData[0].bx;
          rawDataAsGap.by = occ.RawData[0].by;
          rawDataAsGap.cx = occ.RawData[0].cx;
          rawDataAsGap.cy = occ.RawData[0].cy;
          rawDataAsGap.dx = occ.RawData[0].dx;
          rawDataAsGap.dy = occ.RawData[0].dy;
          rawDataAsGap.center = this.calculateIntersection(
            rawDataAsGap.ax,
            rawDataAsGap.ay,
            rawDataAsGap.cx,
            rawDataAsGap.cy,
            rawDataAsGap.bx,
            rawDataAsGap.by,
            rawDataAsGap.dx,
            rawDataAsGap.dy
          );
          this.setupRawData(occ.RawData[0], occ.RawData[0], areaInfo, responseFromServer, occ);
          rawDataAsGap.rawDatas = [occ.RawData[0]];
          rawDataAsGap.paidBy = paidBy;

          rawDatas.push(rawDataAsGap);
          return rawDatas;
        })
      ),
      // cards: this.setupCards(responseFromServer, gaps ? gaps.fixedGaps : null),
      // infieldCards: this.setupclevercitiCards(responseFromServer, gaps ? gaps.fixedGaps : null),
      // thirdPartys: this.setupThirdPartySensors( responseFromServer, gaps ? gaps.fixedGaps : null ),
    };
  }
  _.forEach(gaps ? gaps.fixedGaps : null, (fixedGap: Gap) => {
    this.settingCustomStateToGap(fixedGap, areaInfo!, responseFromServer.customState);
    if (this.checkForOfflineFrame(fixedGap, responseFromServer.offlineFrames)) {
      fixedGap.offline = true;
    } else {
      fixedGap.offline = false;
    }
    const predictedState = _.find(responseFromServer.predicedState, {
      RefData: fixedGap.reference,
    });
    if (predictedState) {
      fixedGap.predictedState = predictedState.predicedState;
    } else {
      fixedGap.predictedState = null as any;
    }
    const occupied = _.find(allOccupied, (occ) => {
      return occ.GapIds === fixedGap.gapid || occ.rawRefData === fixedGap.reference;
    });
    if (occupied) {
      fixedGap.occupied = true;
      fixedGap.rawDatas = [];
      let paidBy = '';
      if (occupied.paymentData) {
        if (occupied.paymentData.length > 1) {
          paidBy = 'DP';
        } else if (occupied.paymentData.length === 1 ) {
          if (occupied.paymentData[0].data) {
            if (occupied.paymentData[0].data.Provider === 'IPS') {
              paidBy = 'IPS';
            } else if (occupied.paymentData[0].data.Provider === 'PayByPhone') {
              paidBy = 'PHONE';
            }
          }
        }
      }

      fixedGap.paidBy = paidBy;

      _.forEach(occupied.RawData, (rawDataFromOcccupiedGap) => {
        const rawDataForGap = {
          carID: '',
          arrival: null,
          arrivalDetectorLos: null,
          lengthOfStay: '',
          stamp: '',
          gapId: occupied.GapIds,
          reference: occupied.rawRefData,
          parkingPurchasedDate: null,
          parkingExpirationDate: null,
          parkingExpired: null,
        };
        this.setupRawData(rawDataForGap, rawDataFromOcccupiedGap, areaInfo, responseFromServer, occupied);
        fixedGap.rawDatas!.push(rawDataForGap);
      });
    } else {
      fixedGap.occupied = false;
      fixedGap.rawDatas = [];
    }
  });
  const floats = this.parseFloatingSpaces(
    responseFromServer.floatingCells,
    gaps ? gaps.floatingGaps : null,
    responseFromServer.customState,
    areaInfo
  );
  _.forEach(gaps.floatingGaps, (floatingGap) => {
    this.settingCustomStateToGap(floatingGap, areaInfo!, responseFromServer.customState);
  });

  return {
    gaps: gaps,
    // cards: this.setupCards(responseFromServer, gaps ? gaps.fixedGaps : null),
    floatingGaps: floats,
    // infieldCards: this.setupclevercitiCards(responseFromServer, gaps ? gaps.fixedGaps : null),
    // thirdPartys: this.setupThirdPartySensors( responseFromServer, gaps ? gaps.fixedGaps : null ),
  };
}


private parseFloatingSpaces(
  floatingCellsFromServer: any[],
  floatingGaps: Gap[] | null | undefined,
  customStates: any[],
  areaInfo?: AreaInfo
) {
  const floats:any = [];
  _.forEach(floatingCellsFromServer, (floatingCell) => {
    const carInFloatingGap = new Gap();
    carInFloatingGap.path = [
      { lng: floatingCell.ax, lat: floatingCell.ay },
      { lng: floatingCell.bx, lat: floatingCell.by },
      { lng: floatingCell.cx, lat: floatingCell.cy },
      { lng: floatingCell.dx, lat: floatingCell.dy },
    ];
    carInFloatingGap.ay = floatingCell.ax;
    carInFloatingGap.ax = floatingCell.ay;
    carInFloatingGap.by = floatingCell.bx;
    carInFloatingGap.bx = floatingCell.by;
    carInFloatingGap.cy = floatingCell.cx;
    carInFloatingGap.cx = floatingCell.cy;
    carInFloatingGap.dy = floatingCell.dx;
    carInFloatingGap.dx = floatingCell.dy;
    carInFloatingGap.center = this.calculateIntersection(
      carInFloatingGap.ax,
      carInFloatingGap.ay,
      carInFloatingGap.cx,
      carInFloatingGap.cy,
      carInFloatingGap.bx,
      carInFloatingGap.by,
      carInFloatingGap.dx,
      carInFloatingGap.dy
    );
    carInFloatingGap.occupied = floatingCell.sType === 'eOccupied';
    // floating gaps custom state
    const customStateFromCustomStatesArray = _.find(customStates, {
      Name: floatingCell.ParentGapName,
    });
    if (customStateFromCustomStatesArray) {
      carInFloatingGap.name = floatingCell.ParentGapName;
      this.settingCustomStateToGap(carInFloatingGap, areaInfo!, customStates);
      if (carInFloatingGap.customState && carInFloatingGap.customState === 'occupied') {
        carInFloatingGap.occupied = true;
      } else if (carInFloatingGap.customState && carInFloatingGap.customState === 'free') {
        carInFloatingGap.occupied = false;
      }
    }
    carInFloatingGap.rawDatas = carInFloatingGap.occupied
      ? [
        {
          carID: floatingCell.id ? floatingCell.id.split('-')[0] : '',
          stamp: floatingCell.stamp,
          arrival: this.parseDateString(floatingCell.arrival),
        },
      ]
      : [];
    carInFloatingGap.parenFloatingGapId = floatingCell.ParentGapIds;
    carInFloatingGap.gapid = floatingCell.id;
    floats.push(carInFloatingGap);
  });
  return floats;
}

getFixedGapsViewIdInsideGroup(groupGap:any): string {
  const ids:any = [];
  _.forEach(this.fixedGaps, (fixedGap) => {
    if (ids.indexOf(fixedGap.viewid) === -1) {
      const inside = this.checkIfIsInside(fixedGap, groupGap);
      if (inside) {
        ids.push(fixedGap.viewid);
      }
    }
  });
  return ids.join(',');
}

getFloatingGapsViewIdInsideGroup(groupGap:any): string {
  const ids:any = [];
  _.forEach(this.floatingGaps, (floatingGap) => {
    if (ids.indexOf(floatingGap.viewid) === -1) {
      const inside = this.checkIfIsInside(floatingGap, groupGap);
      if (inside) {
        ids.push(floatingGap.viewid);
      }
    }
  });
  return ids.join(',');
}

getFixedGapsInsideGroup(): Gap[] {
    const gaps: Gap[] = [];
      _.forEach(this.fixedGaps, (fixedGap) => {
        const inside = this.checkIfIsInside(fixedGap, this.accessGap);
        if (inside) {
          gaps.push(fixedGap);
        }
      });
    
    return gaps;
  }

  checkIfIsInside(gapOrCard: { center?:any; ax?:any; ay?:any; bx?:any; by?:any; cx?:any; cy?:any; dx?:any; dy?:any; location?: any }, margins: Gap) {
    if (gapOrCard && margins) {
      if (gapOrCard.location) {
      } else if (!gapOrCard.center || !gapOrCard.center.length) {
        gapOrCard.center = this.calculateIntersection(
          gapOrCard.ax,
          gapOrCard.ay,
          gapOrCard.cx,
          gapOrCard.cy,
          gapOrCard.bx,
          gapOrCard.by,
          gapOrCard.dx,
          gapOrCard.dy
        );
      }
      let x = gapOrCard.center ? gapOrCard.center[0] : gapOrCard.location.lat,
        y = gapOrCard.center ? gapOrCard.center[1] : gapOrCard.location.lng;
      const areaInfo: AreaInfo = this.getAreaInfo(this.accessGap.gapid!);
      if (areaInfo && areaInfo.mapOffset) {
        x += areaInfo.mapOffset.x;
        y += areaInfo.mapOffset.y;
      }
      let inside = false;
      for (let i = 0, j = 3; i < 4; j = i++) {
        const xi = margins.path![i].lat,
          yi = margins.path![i].lng;
        const xj = margins.path![j].lat,
          yj = margins.path![j].lng;

        const intersect = yi! > y !== yj! > y && x < ((xj! - xi!) * (y - yi!)) / (yj! - yi!) + xi!;
        if (intersect) {
          inside = !inside;
        }
      }
      return inside;
    }
    return false;
  }

private getCoordinatesStringFromAccessGap() {
    return (
        'ax=' +
        this.accessGap.ax +
        '&ay=' +
        this.accessGap.ay +
        '&bx=' +
        this.accessGap.bx +
        '&by=' +
        this.accessGap.by +
        '&cx=' +
        this.accessGap.cx +
        '&cy=' +
        this.accessGap.cy +
        '&dx=' +
        this.accessGap.dx +
        '&dy=' +
        this.accessGap.dy
    );
}

private async saveGroupGaps(res: Response) {
    const serverGroupViews = this.extractData(res);
    this.groupGaps = [];
    this.statisticViews = [];
    const areaInfo: AreaInfo = this.getAreaInfo(this.accessGap.gapid!) || new AreaInfo();
    _.forEach(serverGroupViews, (view: any) => {
      if (view.gaps) {
        _.forEach(view.gaps, (gap: any) => {
          const groupStatus: {
            groupid: string;
            customeName: string;
            disabled: boolean;
          } = _.find(areaInfo.groupsSettings, { groupid: gap.GapIds })!;
          if (gap.Comment.indexOf('#DONT_USE_IN_CLIENT#') === -1) {
            const parsedGap = this.parseServerGap(gap);
            if (groupStatus) {
              if (groupStatus.disabled) {
                return;
              } else if (groupStatus.customeName) {
                parsedGap.name = groupStatus.customeName;
              }
            }
            if (this.accessGap) {
              this.setMapOffset(this.accessGap.gapid!, parsedGap);
              this.setMapOffsetForBounds(this.accessGap.gapid!, parsedGap);
            }
            if (!this.checkForIdenticalGap(this.groupGaps, parsedGap)) {
              this.groupGaps.push(parsedGap);
            }
          }
        });
        if (areaInfo.enableStatisticsViews && !_.find(this.statisticViews, { id: view.id })) {
          this.setViewCoordinates(view);
          this.statisticViews.push({
            name: view.Name,
            gaps: view.gaps,
            id: view.id,
            isView: true,
            bounds: view.bounds,
            center: view.center,
            gapid: view.id,
          });
        }
      }
    });
    if (areaInfo.enableStatisticsViews) {
      this.getHandicapedViewsFromServer().then((views) => {
        _.forEach(views, (view:any) => {
          if (!_.find(this.statisticViews, { id: view.id })) {
            this.statisticViews.push(view);
          }
        });
      });
    }
    this.getBubbleGapsFromServer().then((nothing) => {});
    this.geLosViewsFromServer().then((nothing) => {});
    if (!this.groupGaps.length) {
      // this.alertService.error('Server response: there are no groups in this area');
      return this.getFixedGapsFromServer();
    } else {
      this.groupGaps.sort(function (a:any, b:any) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
      if (this.groupGaps.length === 1) {
        this.groupGaps[0].originalGroupName = this.groupGaps[0].name;
        this.groupGaps[0].name = this.accessGap.name;
      }
      return this.getFixedGapsFromServer();
    }
  }

  //get AreaInfo with accessGapId
  getAreaInfo(accessGapId: string): AreaInfo {
    let areaInfo: AreaInfo | undefined = _.find(this.areaInfos, { accessGapId: accessGapId });
    if (areaInfo) {
      return areaInfo;
    }
    areaInfo = new AreaInfo();
    areaInfo.accessGapId = accessGapId;
    this.setInternalUserRights(areaInfo);
    this.areaInfos.push(areaInfo);
    return areaInfo;
  }

  private setInternalUserRights(responseInfoArea:AreaInfo) {
    responseInfoArea.sensorsWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.networkWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.manualChangesWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.liveViewWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.onsiteTestingWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.operationsWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.reportsWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.sensorsStatusWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.serversStatusWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.displayesWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.circWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.occupancyWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.systemPerformanceWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.statisticsWidgetStatus = WidgetStatusEnum.ENABLED;
    responseInfoArea.areaDisabled = false;
  }

  parseServerGap(serverGap: any, stampsEnabled?: boolean, writeable?: boolean) {
    let gap: AccessGap | Gap;
    if (stampsEnabled || writeable) {
      gap = new AccessGap();
      (gap as AccessGap).stampsEnabled = stampsEnabled;
      (gap as AccessGap).writeable = writeable;
    } else {
      gap = new Gap();
    }
    gap.ax = serverGap.ax;
    gap.ay = serverGap.ay;
    gap.bx = serverGap.bx;
    gap.by = serverGap.by;
    gap.cx = serverGap.cx;
    gap.cy = serverGap.cy;
    gap.dx = serverGap.dx;
    gap.dy = serverGap.dy;
    gap.gapid = serverGap.GapIds;
    gap.viewid = serverGap.viewIds;
    gap.name = serverGap.Name;
    gap.reference = serverGap.rawdataReference;
    gap.center = this.calculateIntersection(gap.ax, gap.ay, gap.cx, gap.cy, gap.bx, gap.by, gap.dx, gap.dy);
    gap.path = [
      { lat: gap.ax, lng: gap.ay },
      { lat: gap.bx, lng: gap.by },
      { lat: gap.cx, lng: gap.cy },
      { lat: gap.dx, lng: gap.dy },
    ];
    const west = _.min([gap.ay, gap.by, gap.cy, gap.dy]);
    const east = _.max([gap.ay, gap.by, gap.cy, gap.dy]);
    const south = _.min([gap.ax, gap.bx, gap.cx, gap.dx]);
    const north = _.max([gap.ax, gap.bx, gap.cx, gap.dx]);
    gap.bounds = { east: east, west: west, south: south, north: north };
    gap.level = serverGap.Altitude;
    gap.verticalFloats = serverGap.alongLat ? false : true;

    return gap;
  }

  setMapOffset(accessGapId: string, gap: Gap | Slot): void {
    const areaInfo = this.getAreaInfo(accessGapId);
    if (areaInfo && areaInfo.mapOffset) {
      gap.path![0].lat = gap.path![0].lat! + areaInfo.mapOffset.x;
      gap.path![0].lng = gap.path![0].lng!+ areaInfo.mapOffset.y;
      gap.path![1].lat = gap.path![1].lat! + areaInfo.mapOffset.x;
      gap.path![1].lng = gap.path![1].lng! + areaInfo.mapOffset.y;
      gap.path![2].lat = gap.path![2].lat! + areaInfo.mapOffset.x;
      gap.path![2].lng = gap.path![2].lng! + areaInfo.mapOffset.y;
      gap.path![3].lat = gap.path![3].lat! + areaInfo.mapOffset.x;
      gap.path![3].lng = gap.path![3].lng! + areaInfo.mapOffset.y;
      (<any>gap).center = this.calculateIntersection(
        (<any>gap).ax + areaInfo.mapOffset.x,
        (<any>gap).ay + areaInfo.mapOffset.y,
        (<any>gap).cx + areaInfo.mapOffset.x,
        (<any>gap).cy + areaInfo.mapOffset.y,
        (<any>gap).bx + areaInfo.mapOffset.x,
        (<any>gap).by + areaInfo.mapOffset.y,
        (<any>gap).dx + areaInfo.mapOffset.x,
        (<any>gap).dy + areaInfo.mapOffset.y
      );
    }
  }

  setMapOffsetForBounds(accessGapId: string, gap: Gap): void {
    const areaInfo = this.getAreaInfo(accessGapId);
    if (areaInfo && areaInfo.mapOffset) {
      gap.bounds!.north! += areaInfo.mapOffset.x;
      gap.bounds!.south! += areaInfo.mapOffset.x;
      gap.bounds!.east! += areaInfo.mapOffset.y;
      gap.bounds!.west! += areaInfo.mapOffset.y;
    }
  }

  calculateIntersection(
    line1StartX: any,
    line1StartY: any,
    line1EndX: any,
    line1EndY: any,
    line2StartX: any,
    line2StartY: any,
    line2EndX: any,
    line2EndY: any
  ) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite)
    let onLine1 = false;
    let onLine2 = false;
    let denominator, a, b, numerator1, numerator2;
    const result = {
      x: 0,
      y: 0,
    };
    denominator =
      (line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY);
    if (denominator === 0) {
      return [result.x, result.y];
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
    numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + a * (line1EndX - line1StartX);
    result.y = line1StartY + a * (line1EndY - line1StartY);

    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
      onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
      onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    if (onLine1 && onLine2) {
      return [result.x, result.y];
    } else {
      return [0, 0];
    }
  }

  private setViewCoordinates(view:any) {
    let xMin:any;
    let xMax:any;
    let yMin:any;
    let yMax:any;
    _.forEach(view.gaps, (gap: Gap) => {
      if (!xMin) {
        xMin = _.min([gap.ax, gap.bx, gap.cx, gap.dx]);
      } else {
        const minx = _.min([gap.ax, gap.bx, gap.cx, gap.dx]);
        if (minx! < xMin) {
          xMin = minx;
        }
      }
      if (!xMax) {
        xMax = _.max([gap.ax, gap.bx, gap.cx, gap.dx]);
      } else {
        const maxx = _.max([gap.ax, gap.bx, gap.cx, gap.dx]);
        if (maxx! > xMax) {
          xMax = maxx;
        }
      }
      if (!yMin) {
        yMin = _.min([gap.ay, gap.by, gap.cy, gap.dy]);
      } else {
        const miny = _.min([gap.ay, gap.by, gap.cy, gap.dy]);
        if (miny! < yMin) {
          yMin = miny;
        }
      }
      if (!yMax) {
        yMax = _.max([gap.ay, gap.by, gap.cy, gap.dy]);
      } else {
        const maxy = _.max([gap.ay, gap.by, gap.cy, gap.dy]);
        if (maxy! > yMax) {
          yMax = maxy;
        }
      }
    });
    view.bounds = { east: yMax, west: yMin, south: xMin, north: xMax };
    view.center = [(xMin + xMax) / 2, (yMin + yMax) / 2];
    for (let index = 0; index < view.gaps.length; index++) {
      view.gaps[index] = view.gaps[index].path ? view.gaps[index] : this.parseServerGap(view.gaps[index]);
    }
  }

  private checkForIdenticalGap(gapsArray: Gap[], gap: Gap): boolean {
    let identicalGapExists = false;
    _.forEach(gapsArray, (gapFromArray: any) => {
      if (gap.center![0] === gapFromArray.center[0] && gap.center![1] === gapFromArray.center[1]) {
        identicalGapExists = true;
      }
    });
    return identicalGapExists;
  }

  checkForOfflineFrame(gap: Gap, offlineFrames: string[]): boolean {
    const gapFrame: string = gap.reference!.split('#')[0];
    if (_.indexOf(offlineFrames, gapFrame) === -1) {
      return false;
    }
    return true;
  }

  private async getHandicapedViewsFromServer() {
    const params =
      this.getCoordinatesStringFromAccessGap() + '&type=Handicap&userid=' + this.userId;

         return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers }).pipe(
          map((res) => this.saveHandicapedViews(<any>res)),
          catchError((err) => this.handleError(err))
        );
    
  }

  private async getBubbleGapsFromServer() {
    const params =  this.getCoordinatesStringFromAccessGap() + '&type=BubbleGap&userid=' + this.userId;

     
        return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers })
        .pipe(
          map((res) => this.saveBubbleGaps(<any>res)),
          catchError((err) => this.handleError(err))
        );
  
  }

  private async geLosViewsFromServer() {
    const params = this.getCoordinatesStringFromAccessGap() + '&type=Limited&userid=' + this.userId;

    
        return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers }).pipe(
          map((res) => this.saveLosViews(<any>res)),
          catchError((err) => this.handleError(err))
        );
  }

  private  getFixedGapsFromServer() {
    const params = this.getCoordinatesStringFromAccessGap() + '&type=Fixed&userid=' + this.userId;
   
        return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers }).pipe(
          map((res) => this.saveFixedGaps(<any>res)),
          catchError((err) => this.handleError(err))
        );
   
  }

  private saveFixedGaps(res: Response) {
    const serverFixedViews = this.extractData(res);
    this.fixedGaps = [];
    const areaInfo: AreaInfo = this.accessGap
      ? this.getAreaInfo(this.accessGap.gapid!) || new AreaInfo()
      : new AreaInfo();
    _.forEach(serverFixedViews, (view: any) => {
      if (view.gaps) {
        _.forEach(view.gaps, (gap: any) => {
          if (
            ((!gap.Comment ||
              (gap.Comment.indexOf('#DONT_USE_IN_CLIENT_ALL#') === -1 &&
                gap.Comment.indexOf('#DONT_USE_IN_CLIENT#') === -1)) &&
              !_.find(this.fixedGaps, { gapid: gap.GapIds })) ||
            (gap.Comment &&
              gap.Comment.indexOf('#DONT_USE_IN_CLIENT#') !== -1 &&
              !_.find(this.fixedGaps, { gapid: gap.GapIds }))
          ) {
            const parsedGap: Gap = this.parseServerGap(gap);
            if (!areaInfo.hideMarkers) {
              if (gap.Comment.indexOf('#LOWER_DETECTION#') > -1) {
                parsedGap.lowDetection = true;
                // parsedGap.frameColor = '#eaea1c';
                // parsedGap.showFrame = true;
              } else if (gap.Comment.indexOf('#NO_DETECTION#') > -1) {
                parsedGap.noDetection = true;
                // parsedGap.frameColor = '#c63b23';
                // parsedGap.showFrame = true;
              }
            }
          
              if (gap.Comment && /[A-Z]{2}\/[A-Z]{2}\/[A-Z]{2}/.test(gap.Comment)) {
                parsedGap.garageParkingType! = gap.Comment.split('/');
              }
            

            // if (gap.Comment && /^[A-Z]{2}$/.test(gap.Comment)) {
            //   parsedGap.parkingType = ParkingType[`${gap.Comment}`];
            // }
            if (this.accessGap) {
              this.setMapOffset(this.accessGap.gapid!, parsedGap);
            }
            this.fixedGaps.push(parsedGap);
          }
        });
        if (this.fixedGaps.some((item) => item.parkingType !== undefined)) {
          this.accessGap.areaHasParkingTypes = true;
        }
      }
    });
    return this.getFloatingGapsFromServer();
  }

  private async getFloatingGapsFromServer() {
    const params =
      this.getCoordinatesStringFromAccessGap() + '&type=Floating&userid=' + this.userId;

  
        return this.http.get('https://query-anker.cleverciti.com/ccs/city/view/byuserid?' + params, { headers: this.headers }).pipe(
          map((res) => this.saveFloatingGaps(<any>res)),
          catchError((err) => this.handleError(err))
        );
 
  }

  private saveFloatingGaps(res: Response) {
    const serverFloatingViews = this.extractData(res);
    this.floatingGaps = [];
    _.forEach(serverFloatingViews, (view:any) => {
      if (view.gaps) {
        _.forEach(view.gaps, (gap:any) => {
          this.floatingGaps.push(this.parseServerGap(gap));
        });
      }
    });
    return serverFloatingViews;
  }

  private saveHandicapedViews(res: Response) {
    const serverHandivcapedViews = this.extractData(res);
    const handicapedViews:any = [];
    _.forEach(serverHandivcapedViews, (view:any) => {
      if (view.gaps) {
        this.setViewCoordinates(view);
        handicapedViews.push({
          name: view.Name,
          gaps: view.gaps,
          id: view.id,
          isView: true,
          bounds: view.bounds,
          center: view.center,
          gapid: view.id,
        });
      }
    });
    return handicapedViews;
  }

  private saveBubbleGaps(res: Response) {
    const serverGarageViews = this.extractData(res);
    this.bubbleGaps = [];
    _.forEach(serverGarageViews, (view: any) => {
      if (view.gaps) {
        _.forEach(view.gaps, (gap: any) => {
          const bubbleGap: BubbleGap = this.parseServerGap(gap) as BubbleGap;
          bubbleGap.zoomLevelThreshold = gap.zoomLevel;
          bubbleGap.zoomInLocation = { lat: gap.zoomInX, lng: gap.zoomInY };
          bubbleGap.zoomOutLocation = { lat: gap.zoomOutX, lng: gap.zoomOutY };
          bubbleGap.referenceID = gap.ReferenceID;
          bubbleGap.useGroupIdAsReference = gap.UseIDAsGroupingReference;
          bubbleGap.comment = gap.Comment;
          this.bubbleGaps.push(bubbleGap);
        });
      }
    });
    return this.bubbleGaps;
  }

  private saveLosViews(res: Response) {
    const serverLosViews = this.extractData(res);
    this.losGaps = [];
    _.forEach(serverLosViews, (view:any) => {
      if (view.gaps) {
        _.forEach(view.gaps, (gap:any) => {
          const losGap = this.parseServerLosGap(gap);
          this.losGaps.push(losGap);
        });
      }
    });
  }

  parseServerLosGap(serverGap: any) {
    const losGap: LosGap = this.parseServerGap(serverGap) as LosGap;
    losGap.intervals = [];
    _.forEach(serverGap.intervall, (int: any) => {
      losGap.intervals!.push({
        from: int.from,
        rgb: int.rgb,
        emails: int.emailNotification,
      });
    });
    return losGap;
  }
  
private extractData(res: Response) {
    let body:any;
    try {
      body = res;
    } catch (error) {
      // this.alertService.error('Server error: empty data returned');
      return null;
    }
    if (
      body &&
      body.Result &&
      body.Result.views &&
      body.Result.views.length &&
      body.Result.views[0].gaps &&
      body.Result.views[0].gaps.length
    ) {
      return body.Result.views;
    } else {
      return null;
    }
  }

  private extractDataLiveStatus(res: Response) {
    let body:any;
    try {
      body = res;
    } catch (error) {
      // this.alertService.error('Server error: empty data returned');
      return null;
    }
    if (body && body.Result) {
      if (body.Result.errorCode === 300) {
        return null;
      }
      return body.Result;
    } else {
      // this.alertService.error('Server error: empty data for live status returned');
      return null;
    }
  }


  private getCoordinatesStringFromGap(gap: Gap) {
    return (
      'ax=' +
      gap.ax +
      '&ay=' +
      gap.ay +
      '&bx=' +
      gap.bx +
      '&by=' +
      gap.by +
      '&cx=' +
      gap.cx +
      '&cy=' +
      gap.cy +
      '&dx=' +
      gap.dx +
      '&dy=' +
      gap.dy
    );
  }

  private setupRawData(rawDataForGap:any, rawDataFromOcccupiedGap:any, areaInfo:any, responseFromServer:any, occupied:any) {
    rawDataForGap.stamp = rawDataFromOcccupiedGap.stamp || null;
    rawDataForGap.carID = rawDataFromOcccupiedGap.car.split('-')[0];
    rawDataForGap.arrival = this.parseDateString(rawDataFromOcccupiedGap.arrival);
    rawDataForGap.arrivalDetectorLos = this.parseDateString(rawDataFromOcccupiedGap.arrival_detector_los);
    if (responseFromServer.hasPaymentData) {
      rawDataForGap.parkingExpired = true;
      if (occupied.parkingMeter && occupied.parkingMeter.expirationDate && occupied.parkingMeter.purchasedDate) {
        rawDataForGap.parkingPurchasedDate = this.parseDateString(occupied.parkingMeter.purchasedDate);
        rawDataForGap.parkingExpirationDate = this.parseDateString(occupied.parkingMeter.expirationDate);
        rawDataForGap.parkingExpired = rawDataForGap.parkingExpirationDate < new Date();
      }
    }
  }

  parseDateString(dateAsString: string): Date {
    let value;
    if (!dateAsString) {
      return null as any;
    }
    try {
      value = new Date(dateAsString);
      if (!Number.isNaN(value.valueOf())) {
        return value;
      }
    } catch (e) {}
    try {
      dateAsString = dateAsString.replace('/Date(', '').replace(')/', '');
      const arrayOfDateStrings = dateAsString.indexOf('+') > -1 ? dateAsString.split('+') : dateAsString.split('-');
      if (arrayOfDateStrings.length > 1) {
        let extraHours = parseInt(arrayOfDateStrings[1].replace(/0/g, ''), null as any);
        if (Number.isNaN(extraHours)) {
          extraHours = 0;
        }
        if (dateAsString.indexOf('+') > -1) {
          value = parseInt(arrayOfDateStrings[0], null as any) + 1000 * 60 * 60 * extraHours;
        } else {
          value = parseInt(arrayOfDateStrings[0], null as any) - 1000 * 60 * 60 * extraHours;
        }
      } else {
        value = parseInt(dateAsString, null as any);
      }
      if (value === -62135596800000) {
        return null as any;
      }
      const stringDate = new Date(value);
      return stringDate;
    } catch (e) {
      return null as any;
    }
  }

  private settingCustomStateToGap(gap: Gap, areaInfo: AreaInfo, customStates: any[]) {
    const customStateFromCustomStatesArray = _.find(customStates, { Name: gap.name });
    if (customStateFromCustomStatesArray && customStateFromCustomStatesArray.CustomState === '5') {
      customStateFromCustomStatesArray.CustomState = 'reserved';
    }
    let customStateResult;
    if (customStateFromCustomStatesArray && areaInfo && !isNaN(areaInfo.timeZone!)) {
      let customState;
      if (customStateFromCustomStatesArray.length) {
        customState = _.find(customStateFromCustomStatesArray, { Name: gap.name });
      } else {
        customState = _.cloneDeep(customStateFromCustomStatesArray);
      }
      if (customState && customState.CustomState === '5') {
        customState.CustomState = 'reserved';
      }
      if (
        customState.customStateUsage &&
        customState.customStateUsage.UseIntervall &&
        areaInfo.timeZone !== (-1 * new Date().getTimezoneOffset()) / 60
      ) {
        const offsetInHours = new Date().getTimezoneOffset() / 60 + areaInfo.timeZone!;
        const fromTime =
          this.parseDateString(customState.customStateUsage.From).valueOf() + offsetInHours * 3600000;
        const toTime =
          this.parseDateString(customState.customStateUsage.To).valueOf() + offsetInHours * 3600000;
        customState.customStateUsage.From = new Date(fromTime).toISOString();
        customState.customStateUsage.To = new Date(toTime).toISOString();
      } else {
        if (customState.customStateUsage.Monday.From.Active) {
          customState.customStateUsage.Monday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Monday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Tuesday.From.Active) {
          customState.customStateUsage.Tuesday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Tuesday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Wednesday.From.Active) {
          customState.customStateUsage.Wednesday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Wednesday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Thursday.From.Active) {
          customState.customStateUsage.Thursday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Thursday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Friday.From.Active) {
          customState.customStateUsage.Friday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Friday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Saturday.From.Active) {
          customState.customStateUsage.Saturday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Saturday.To.Hours += areaInfo.timeZone;
        }
        if (customState.customStateUsage.Sunday.From.Active) {
          customState.customStateUsage.Sunday.From.Hours += areaInfo.timeZone;
          customState.customStateUsage.Sunday.To.Hours += areaInfo.timeZone;
        }
      }
      customStateResult = customState;
    } else {
      customStateResult = customStateFromCustomStatesArray;
    }
    if (customStateResult && this.chsckIfCustomStateIsInTimeFrame(gap.name!, customStateResult, areaInfo)) {
      gap.customState = customStateResult.CustomState === 'detect' ? null : customStateResult.CustomState;
      gap.customStateUsage = customStateResult;
    } else if (customStateResult) {
      gap.customState = null as any;
      gap.customStateUsage = customStateResult;
    } else {
      gap.customState = null as any;
      gap.customStateUsage = null;
    }
  }

  chsckIfCustomStateIsInTimeFrame(gapName: string, customStates: any[], areaInfo?: AreaInfo): boolean {
    let customState;
    if (customStates.length) {
      customState = _.find(customStates, { Name: gapName });
    } else {
      customState = customStates;
    }
    if (!customState || !customState.customStateUsage) {
      return false;
    } else if (customState.customStateUsage && customState.customStateUsage.Forever) {
      return true;
    }
    let now = new Date();
    const offsetInHours = (-1 * new Date().getTimezoneOffset()) / 60;
    if (areaInfo && !isNaN(areaInfo.timeZone!) && areaInfo.timeZone !== offsetInHours) {
      now = new Date(now.getTime() + (areaInfo.timeZone! - offsetInHours) * 3600000);
    }
    if (customState.customStateUsage.UseIntervall) {
      if (
        now.valueOf() > this.parseDateString(customState.customStateUsage.From).valueOf() &&
        now.valueOf() < this.parseDateString(customState.customStateUsage.To).valueOf()
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.FullMonday) {
      if (now.getDay() === 1) {
        return true;
      }
    }
    if (customState.customStateUsage.FullTuesday) {
      if (now.getDay() === 2) {
        return true;
      }
    }
    if (customState.customStateUsage.FullWednesday) {
      if (now.getDay() === 3) {
        return true;
      }
    }
    if (customState.customStateUsage.FullThursday) {
      if (now.getDay() === 4) {
        return true;
      }
    }
    if (customState.customStateUsage.FullFriday) {
      if (now.getDay() === 5) {
        return true;
      }
    }
    if (customState.customStateUsage.FullSaturday) {
      if (now.getDay() === 6) {
        return true;
      }
    }
    if (customState.customStateUsage.FullSunday) {
      if (now.getDay() === 0) {
        return true;
      }
    }
    if (customState.customStateUsage.Monday.From.Active) {
      if (
        now.getDay() === 1 &&
        this.checkHoursAndMinutes(now, customState.customStateUsage.Monday.From, customState.customStateUsage.Monday.To)
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Tuesday.From.Active) {
      if (
        now.getDay() === 2 &&
        this.checkHoursAndMinutes(
          now,
          customState.customStateUsage.Tuesday.From,
          customState.customStateUsage.Tuesday.To
        )
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Wednesday.From.Active) {
      if (
        now.getDay() === 3 &&
        this.checkHoursAndMinutes(
          now,
          customState.customStateUsage.Wednesday.From,
          customState.customStateUsage.Wednesday.To
        )
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Thursday.From.Active) {
      if (
        now.getDay() === 4 &&
        this.checkHoursAndMinutes(
          now,
          customState.customStateUsage.Thursday.From,
          customState.customStateUsage.Thursday.To
        )
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Friday.From.Active) {
      if (
        now.getDay() === 5 &&
        this.checkHoursAndMinutes(now, customState.customStateUsage.Friday.From, customState.customStateUsage.Friday.To)
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Saturday.From.Active) {
      if (
        now.getDay() === 6 &&
        this.checkHoursAndMinutes(
          now,
          customState.customStateUsage.Saturday.From,
          customState.customStateUsage.Saturday.To
        )
      ) {
        return true;
      }
    }
    if (customState.customStateUsage.Sunday.From.Active) {
      if (
        now.getDay() === 0 &&
        this.checkHoursAndMinutes(now, customState.customStateUsage.Sunday.From, customState.customStateUsage.Sunday.To)
      ) {
        return true;
      }
    }
    return false;
  }

  private checkHoursAndMinutes(
    now: Date,
    from: { Hours: number; Minutes: number },
    to: { Hours: number; Minutes: number }
  ): boolean {
    if (to.Hours > from.Hours || (to.Hours === from.Hours && to.Minutes > from.Minutes)) {
      if (now.getHours() > from.Hours && now.getHours() < to.Hours) {
        return true;
      } else if (now.getHours() === from.Hours && now.getHours() < to.Hours) {
        if (now.getMinutes() > from.Minutes) {
          return true;
        }
        return false;
      } else if (now.getHours() > from.Hours && now.getHours() === to.Hours) {
        if (now.getMinutes() < to.Minutes) {
          return true;
        }
        return false;
      } else if (now.getHours() === from.Hours && now.getHours() === to.Hours) {
        if (now.getMinutes() < to.Minutes && now.getMinutes() > from.Minutes) {
          return true;
        }
        return false;
      }
    } else if (to.Hours < from.Hours || (to.Hours === from.Hours && to.Minutes < from.Minutes)) {
      if (now.getHours() > from.Hours || now.getHours() < to.Hours) {
        return true;
      } else if (
        (now.getHours() === from.Hours && now.getMinutes() > from.Minutes) ||
        (now.getHours() === to.Hours && now.getMinutes() < to.Minutes)
      ) {
        return true;
      }
    }
    return false;
  }

  private handleError(error: any) {
    const errMsg = error.message
      ? error.message
      : error.status || error.statusText
      ? `${error.status} - ${error.statusText}`
      : 'Server error: net::ERR_CONNECTION_REFUSED';
    console.log(errMsg);
    // this.alertService.error('Parking slots data from server is not available, please try to refresh page');
    return throwError(errMsg);
  }


}
