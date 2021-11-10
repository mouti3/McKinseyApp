import {FloatStatus} from './FloatStatus';

export class Gap {
  gapid?: string;
  viewid?: string;
  name?: string;
  reference?: string;
  ax?: number;
  ay?: number;
  bx?: number;
  by?: number;
  cx?: number;
  cy?: number;
  dx?: number;
  dy?: number;
  center?: number[];
  path?: { lat?: number; lng?: number }[];
  bounds?: { east?: number; north?: number; south?: number; west?: number };
  originalGroupName?: string;
  fillColor?: string;
  showFrame?: boolean;
  frameColor?: string;
  strokeWeight?: number;
  lowDetection = false;
  noDetection = false;
  changedGaps?: boolean | number = false;
  color?: string;
  isView?: boolean;
  gaps?: Gap[];
  parkingEvents?: any[];
  rawDatas?: any[];
  customState?: string;
  customStateUsage?: any;
  offline?: boolean;
  occupied?: boolean;
  predictedState?: string;
  parenFloatingGapId?: string;
  parentFloatName?: string;
  level?: number;
  garageParkingType?: string[];
  verticalFloats?: boolean;
  parkingType?: ParkingType;
  paidBy?: string;

}

export enum ParkingType {
    BB = 1,
    ST,
    PR,
    SE,
    PD,
    EV,
    TR,
    SP,
    TP,
  }

export class AccessGap extends Gap {
    stampsEnabled?: boolean;
    writeable?: boolean;
    areaHasParkingTypes?: boolean;
  
    constructor() {
      super();
    }
  }

  export class BubbleGap extends Gap {
    zoomOutLocation?: { lat: number; lng: number };
    zoomInLocation?: { lat: number; lng: number };
    zoomLevelThreshold?: number;
    parkingName?: string;
    referenceID?: string;
    useGroupIdAsReference?: boolean;
    comment?: string;
  }

  export class LosGap extends Gap {
    intervals?: {
      from: number;
      rgb: string;
      emails: string[];
    }[];
  }
