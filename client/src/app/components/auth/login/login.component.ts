import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  token: string = '';
  loginModel: any = {};

  constructor(private authService: AuthService, private router: Router, public activeModal: NgbActiveModal, private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  login() {
    this.authService.login(this.loginModel).subscribe(() => {
      this.router.navigateByUrl('/chat');
    })
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/')
  }

  openRegister() {
    this.modalService.open(RegisterComponent);
    this.activeModal.dismiss();
  }
}
