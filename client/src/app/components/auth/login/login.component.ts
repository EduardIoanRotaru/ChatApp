import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LoginDto } from 'src/app/shared/dto/logindto';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  token: string = '';
  loginModel: any = {};

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  login() {
    this.authService.login(this.loginModel).subscribe((responseToken:any) => {
      localStorage.setItem('token', `${responseToken['token']}`);
      this.router.navigateByUrl('/chat');
    })
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/')
  }
}
