import { Injectable } from "@angular/core";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { environment } from "src/environments/environment";
import { ApiPaths } from "../shared/dto/ApiPaths.enum";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class HubService {
    public hubConnection!: HubConnection;
    url = environment.baseUrl + ApiPaths.chat;
    
    privateMessages: string[]= [];

    username = '';
    private token = '';

    public startConnection() {
        this.hubConnection = new HubConnectionBuilder()
            .withUrl(this.token ? `${this.url}?access_token=${this.token}` : this.url)
            .build();

        this.hubConnection
            .start()
            .then(() => {
                console.log('Connection started!');
                this.hubConnection
                    .invoke('GetConnectionId')
                    .catch(err => console.error(err));
            })
            .catch((err: any) => console.log('Error while establishing connection :('));

        this.hubConnection
            .on('SendMessageToUser', (receiverName: string, receiverConnectionId: string, privateMessage: string, senderName: string) => {
            const text = `${senderName}: ${privateMessage}`;
            this.privateMessages = [...this.privateMessages, text]
        });
    }

    public setToken() {
        this.token = localStorage.getItem('token')?.toString()!;
    }
}