import { StringMap } from '@angular/compiler/src/compiler_facade_interface';
import { Component, ComponentFactoryResolver, EventEmitter, Input, NgZone, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';
import { HelperService } from 'src/app/services/helper.service';
import { HubService } from 'src/app/services/hub.service';

@Component({
  selector: 'app-private-chat',
  templateUrl: './private-chat.component.html',
  styleUrls: ['./private-chat.component.scss']
})
export class PrivateChatComponent implements OnInit {
  receiverConnectionId!: string;
  receiverName!: string;

  senderConnectionId!: string;
  senderName!: string;

  messageSendBy: string = '';
  clientConnectionId: string = '';
  privateMessage = '';
  privateMessages: string[] = [];
  responseConnectionId: string = '';
  responseName: string = '';
  isResponse: boolean = true;
  visible: boolean = false;
  tabName: string = '';

  componentIndex: number = 0;

  public textArea: string = '';
  public isEmojiPickerVisible: boolean = false;

  hubConnection!: HubConnection;

  constructor(private hubService: HubService, private helperService: HelperService) {
  }

  ngOnInit(): void {
  }

  sendPrivateMessage() {
    if(this.isResponse) {
      this.receiverConnectionId = this.responseConnectionId;
      this.receiverName = this.responseName;
    }
    
    this.hubService.hubConnection
      .invoke('SendMessageToUser', this.receiverName, this.receiverConnectionId, this.senderConnectionId, this.privateMessage, this.senderName)
      .catch(err => console.error(err))
      .finally(
        () => {
          const text = `${this.senderName}: ${this.privateMessage}`;
          this.privateMessages.push(text);
        }
      )
  }

  openComponent() {
    this.helperService.emitComponentIndex(this.componentIndex);
  }

  public addEmoji(event: any) {
    this.privateMessage = `${this.privateMessage}${event.emoji.native}`;
    this.isEmojiPickerVisible = false;
  }
}
