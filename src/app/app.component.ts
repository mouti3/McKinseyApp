import { Component, OnInit } from '@angular/core';
import { GapService } from './gap.service';
import { LevelMc } from './models/LevelMc';

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
      }, 1000);
    } catch(e) {
      console.log(e);
    }
  }

     loadParkingData() {
      this.gapService.getAllLevelValues().subscribe((values:any) => {
        this.allLevelData = [
          new LevelMc("Level-2",values.L2_ST_Free,values.L2_EC_Free,values.L2_HC_Free),
          new LevelMc("Level-2A",values.L2A_ST_Free,values.L2A_EC_Free,values.L2A_HC_Free),
          new LevelMc("Level-3",values.L3_ST_Free,values.L3_EC_Free,values.L3_HC_Free),
          new LevelMc("Level-3A",values.L3A_ST_Free,values.L3A_EC_Free,values.L3A_HC_Free),
          new LevelMc("Level-4",values.L4_ST_Free,values.L4_EC_Free,values.L4_HC_Free),
          new LevelMc("Level-4A",values.L4A_ST_Free,values.L4A_EC_Free,values.L4A_HC_Free),
        ];        
      });
      } 
  
}
