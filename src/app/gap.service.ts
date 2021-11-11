import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})
export class GapService {


constructor(private http: HttpClient) {

}

public getAllLevelValues() {
  return this.http.get("http://81.169.143.184:1950/ccs/city/sensor/tag/customplugin/mckinsey/overview?id=a77c5485-324e-4f5c-a7bd-3706191f2dd2");
}

}
