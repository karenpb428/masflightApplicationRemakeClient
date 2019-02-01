import { Component, OnInit } from '@angular/core';
import { Globals } from '../globals/Globals';

@Component({
  selector: 'app-msf-exclude-fares-lower',
  templateUrl: './msf-exclude-fares-lower.component.html',
  styleUrls: ['./msf-exclude-fares-lower.component.css']
})
export class MsfExcludeFaresLowerComponent implements OnInit {

  data: any[] = [
    {id: 0},
    {id: 20},
    {id: 30},
    {id: 40},
    {id: 50},
    {id: 60},
    {id: 70},                          
    {id: 80},
    {id: 90},
    {id: 100}
];
constructor(public globals: Globals) { }


ngOnInit() { 
}
}
