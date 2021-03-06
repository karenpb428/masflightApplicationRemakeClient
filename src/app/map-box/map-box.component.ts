import { Component, OnInit, ViewChildren, ViewChild, SimpleChanges, Input } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ApplicationService } from '../services/application.service';
import { Globals } from '../globals/Globals';

@Component({
  selector: 'app-map-box',
  templateUrl: './map-box.component.html',
  styles: [`
    mgl-map {
      height: 100%;
      width: 100%;
    }
  `]
})
export class MapBoxComponent implements OnInit{

  @Input('showCategoryPanel')
  showCategoryPanel: boolean;

  @ViewChild('map')
  map: mapboxgl.Map;

  zoom = [3];
  
  center = [-73.968285, 40.785091];

  data = {'type': 'FeatureCollection',
            'features': []
          };

  source = {
    'type': 'geojson',
    'data': this.data
  }

  constructor(private services: ApplicationService, public globals: Globals) { }

  ngOnInit(): void {
    this.getTrackingDataSource();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showCategoryPanel'])
    {
      if (this.map)
        this.map.resize ();
    }
  }

  refresh(){
    if (this.map)
      this.map.resize ();
  }

  
  getTrackingDataSource(){
    this.globals.isLoading = true;
    this.services.getMapBoxTracking(this,this.successHandler, this.errorHandler);    
  }

  successHandler(_this,features){
    if(this.globals.isLoading){
      _this.data = {
        'type': 'FeatureCollection',
        'features': features
      } ;
    }
    _this.globals.isLoading = false;    
	}

  errorHandler(_this,data){
    _this.globals.isLoading = false;
  }

}
