import { Injectable } from '@angular/core';
import { LoginDto } from '../shared/dto/logindto';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiPaths } from '../shared/dto/ApiPaths.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getToken() {
    return localStorage.getItem('token');
  }

  login(loginDto: LoginDto) {
    const path = `${this.baseUrl}${ApiPaths.login}`;
    return this.http.post(path, loginDto);
  }

  logout()
  {
    localStorage.removeItem('token');
  }

  register(model: any) {
    // const httpOptions = {
    //   headers: new HttpHeaders({
    //       'Access-Control-Allow-Origin': '*',
    //       })    
    //     };
    return this.http.post(`${this.baseUrl}${ApiPaths.register}`, model)
  }

  verifyToken(): Observable<boolean> {
    const token = localStorage.getItem('token')?.toString();

    const httpOptions = {
    headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'charset': 'utf-8',
        })    
      };

    return token ? this.http
      .post(`${this.baseUrl}${ApiPaths.validateToken}`, JSON.stringify(token), httpOptions)
      .pipe(
        map(
          res => {
            if(res) {
              localStorage.setItem('validToken', JSON.stringify(res))
              return true;
            } 
            else {
              return false;
            }
          },
          (error:any) => false
        )
      ) : of(false)
  }

  getUsername() {
    return this.http.get(`${this.baseUrl}${ApiPaths.getUsername}`, {responseType: "text"});
  }
}
