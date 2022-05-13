import { Component, ComponentFactoryResolver, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HelperService } from 'src/app/services/helper.service';
import { HubService } from 'src/app/services/hub.service';
import { PrivateChatComponent } from './private-chat/private-chat.component';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
	message = '';
	username = '';
	connectionId = '';
	clientConnectionId = '';
	messages: string[] = [];
	privateMessages: BehaviorSubject<string> = new BehaviorSubject<string>('');

	privateChats: string[] = []

	connections: { [key: string]: Array<string> } = {};

	componentRef!: ComponentRef<PrivateChatComponent>;
	componentRefTabs: { component: ComponentRef<PrivateChatComponent>, visible: boolean }[]
		= [] as { component: ComponentRef<PrivateChatComponent>, visible: boolean }[];

	enabledLastTabIndex: number = 0;

	public textArea: string = '';
	public isEmojiPickerVisible: boolean = false;

	@ViewChild('componentHolder', { read: ViewContainerRef }) componentHolder!: ViewContainerRef;

	constructor(private hubService: HubService, private componentFactoryResolver: ComponentFactoryResolver, private helperService: HelperService) { }

	ngOnInit() {
		this.hubService.setToken();
		this.hubService.startConnection();
		this.updateConnectionList();

		this.helperService.data$.subscribe(index => {
			this.componentRefTabs.forEach((tab: any) => {
				tab.component.instance.visible = false;
			});
			
			this.componentRefTabs[index].component.instance.visible = true;
		})
	}

	ngAfterViewInit() {
	}

	ngOnDestroy() {
		this.componentRef.destroy();
	}

	public createNewPrivateMessageComponent(senderName: string, senderConnectionId: any): void {
		const exists = this.privateChats.includes(senderConnectionId.toString());
		if (!exists) {
			const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PrivateChatComponent);
			this.componentRef = this.componentHolder.createComponent(componentFactory);

			this.componentRef.instance.receiverConnectionId = senderConnectionId.toString();
			this.componentRef.instance.receiverName = senderName;

			this.componentRef.instance.senderConnectionId = this.clientConnectionId;
			this.componentRef.instance.senderName = this.username;

			this.componentRef.instance.isResponse = false;
			this.componentRef.instance.clientConnectionId = this.clientConnectionId;

			this.privateChats.push(senderConnectionId.toString());

			this.enabledLastTabIndex = this.componentRefTabs.push({
				component: this.componentRef,
				visible: true
			}) - 1;

			this.componentRefTabs[this.enabledLastTabIndex].component.instance.componentIndex = this.enabledLastTabIndex;
			this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = true;
			this.componentRefTabs[this.enabledLastTabIndex].component.instance.tabName = senderName;

			if (this.enabledLastTabIndex > 0)
				this.componentRefTabs[this.enabledLastTabIndex - 1].component.instance.visible = false;
		}
	}

	public sendMessage() {
		if (!this.connectionId) {
			this.hubService.hubConnection
				.invoke('SendMessage', this.username, this.message)
				.catch(err => console.error(err));
		}
	}

	public openTab(event: any) {
		this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = false;
		this.componentRefTabs[event].component.instance.visible = true;
	}

	public addEmoji(event: any) {
		this.message = `${this.message}${event.emoji.native}`;
		this.isEmojiPickerVisible = false;
	}

	private updateConnectionList() {
		this.hubService.hubConnection.on('GetYourUsername', (username) => {
			this.username = username;
		});

		this.hubService.hubConnection.on('GetConnectionId', (connectionId) => {
			this.clientConnectionId = connectionId;
		});

		this.hubService.hubConnection.on('UpdateConnectionsList', (connections) => {
			this.connections = connections;

			delete this.connections[this.username];
		});

		this.hubService.hubConnection
			.on('SendMessage', (username: string, message: string) => {
				const text = `${username}: ${message}`;
				this.messages.push(text);
			});

		this.hubService.hubConnection
			.on('SendMessageToUser', (receiverName: string, receiverConnectionId: string, senderConnectionId: string, privateMessage: string, senderName: string) => {
				const text = `${senderName}: ${privateMessage}`;

				if (typeof this.componentRef === 'undefined')
					this.createNewPrivateMessageComponent(receiverName, receiverConnectionId);

				this.componentRef.instance.privateMessages.push(text)
				this.componentRef.instance.isResponse = true;
				this.componentRef.instance.responseConnectionId = senderConnectionId;
				this.componentRef.instance.responseName = receiverName;

				this.privateChats.push(senderConnectionId.toString());
			});
	}
}
