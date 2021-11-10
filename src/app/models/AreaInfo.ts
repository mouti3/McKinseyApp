export enum DetectionType {
    EVENT = 0,
    DETECTOR = 1,
  }
  
  export class AreaInfo {
    accessGapId?: string;
    mapOffset?: { x: number; y: number };
    sensorsWidgetStatus = 0;
    networkWidgetStatus = 0;
    manualChangesWidgetStatus = 0;
    liveViewWidgetStatus = 0;
    onsiteTestingWidgetStatus = 0;
    operationsWidgetStatus = 0;
    reportsWidgetStatus = 0;
    sensorsStatusWidgetStatus = 0;
    serversStatusWidgetStatus = 1;
    displayesWidgetStatus = 1;
    circWidgetStatus = 1;
    occupancyWidgetStatus = 0;
    systemPerformanceWidgetStatus = 0;
    statisticsWidgetStatus = 2;
    timeZone?: number;
    operatingHoursStart?: number;
    operatingHoursEnd?: number;
    minDate?: Date;
    name?: string;
    areaDisabled = false;
    groupsSettings: { groupid: string; customeName: string; disabled: boolean }[] = [];
    disableLiveLengthOfStay = false;
    disableStatisticsFakeing = false;
    hideFixedGapsWithoutRawdataRef = false;
    enableStatisticsViews = false;
    logo?: string;
    logo2?: string;
    trafficLightsHeader?: string;
    showInEnforcement = false;
    doublePlaces = false;
    flatpannelsUrl?: string;
    hideMarkers?: boolean;
    showPredictedState?: boolean;
    minimal15MinutesOccupancy?: boolean;
    doNotAllowClientServiceRequest?: boolean;
    hideNotifictionMenuIcon?: boolean;
    detectionType: DetectionType = DetectionType.EVENT;
    occupancyStatisticValues?: { filter: number; minimum: number };
    reportOfflineSenosrsMinTime = 120;
    hideWholeAreaInGroupsList? = false;
    imagesForLevel?: {
      [level: number]: {
        src: string;
        position: { centerLat: number; centerLng: number; customName: string; rotation?: number; ratio?: number };
        customName: string;
      };
    };
    hasTagSystem?: boolean;
    mainGroupId?: string;
    subGroupId?: string;
  }
  
  export enum WidgetStatusEnum {
    ENABLED = 0,
    DISABLED = 1,
    REMOVED = 2,
  }
  