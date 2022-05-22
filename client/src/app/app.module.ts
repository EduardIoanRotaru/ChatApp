import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VisitorsService } from './services/visistors';
import { LoginComponent } from './components/auth/login/login.component';
import { ChatComponent } from './components/chat/chat.component';
// import { CanActivateGuard } from './shared/guards/can-activate.guard';
import { CommonModule } from '@angular/common';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { ErrorInterceptor } from './services/error.interceptor';
import { RegisterComponent } from './components/auth/register/register.component';
// import { StartupService } from './services/startup.service';
import { PrivateChatComponent } from './components/chat/private-chat/private-chat.component';
import { JwtInterceptor } from './services/jwtInterceptor';
import { EmojiDirective } from './shared/directives/emoji.directive';

// export function startupServiceFactory(startupService: StartupService): Function {
//   return () => startupService.load();
// }

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ChatComponent,
    RegisterComponent,
    PrivateChatComponent,
    EmojiDirective
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    PickerModule
  ],
  providers: [VisitorsService, 
    // CanActivateGuard, 
    ErrorInterceptor,  
    // StartupService,
    // {
    //     provide: APP_INITIALIZER,
    //     useFactory: startupServiceFactory,
    //     deps: [StartupService],
    //     multi: true
    // },
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    PrivateChatComponent
  ]
})
export class AppModule { }
