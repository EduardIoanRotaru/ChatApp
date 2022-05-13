import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StartupService } from './services/startup.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private router: Router, private startup: StartupService) {}


  ngOnInit(){

        if (!this.startup.startupData) {
          // assign a random username and a random photo
          // store it in an object along with connection list
      }
  }
   
}
