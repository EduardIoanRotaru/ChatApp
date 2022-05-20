import { Component, ComponentFactoryResolver, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HelperService } from 'src/app/services/helper.service';
import { HubService } from 'src/app/services/hub.service';
import { PrivateChatComponent } from './private-chat/private-chat.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { UserProfileService } from 'src/app/services/userProfile.service';
import { map, pipe } from 'rxjs';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
	closeResult = '';
	images: { 'name': string }[] = [];
	message = '';
	username = '';
	userid!: number;
	connectionId = '';
	clientConnectionId = '';
	photo: any;
	messages: {
		img: any,
		message: string
	}[] = [];
	updateProfileDto: {
		name: string,
		photoUrl: string
	} = {} as { name: string, photoUrl: string };

	privateMessages: BehaviorSubject<string> = new BehaviorSubject<string>('');

	privateChats: string[] = []
	photoBackend: any;

	connections: { [key: string]: Array<string> } = {};

	componentRef!: ComponentRef<PrivateChatComponent>;
	componentRefTabs: { component: ComponentRef<PrivateChatComponent>, visible: boolean }[]
		= [] as { component: ComponentRef<PrivateChatComponent>, visible: boolean }[];

	enabledLastTabIndex: number = 0;

	publicIdPhotoToDelete: string = '';

	public textArea: string = '';
	public isEmojiPickerVisible: boolean = false;

	@ViewChild('componentHolder', { read: ViewContainerRef }) componentHolder!: ViewContainerRef;

	constructor(private userService: UserProfileService,
		private modalService: NgbModal,
		private hubService: HubService,
		private componentFactoryResolver: ComponentFactoryResolver,
		private helperService: HelperService) { }

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
				.invoke('SendMessage', this.username, this.photo, this.message)
				.catch(err => console.error(err));
		}
	}

	public openTab(event: any) {
		this.componentRefTabs[this.enabledLastTabIndex].component.instance.visible = false;
		this.componentRefTabs[event].component.instance.visible = true;
	}

	public openModal(content: any) {
		this.userService.getAllImages().subscribe((response: any) => {
			this.images = response;
		}, (error: any) => {
			console.log(error);
		}, () => {
			this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
				this.closeResult = `Closed with: ${result}`;
			}, (reason: any) => {
				this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
			});
		})
	}


	// disable button if form not touched
	// update static image just from clicking
	// when I select a static image
	// -- check if there is a publicIdImage to delete
	// if true then delete the image from cloud and remove the publicId from db

	public updateImage(imageUrl: any) {
		this.photo = imageUrl;
		this.updateProfileDto.photoUrl = this.photo;

		this.deleteCloudPicture();
	}

	public uploadImage(event: any) {
		this.userService.uploadImage(this.userid, event.target.files[0]).subscribe((result: any) => {
			this.photo = result['photoUrl'];
			this.publicIdPhotoToDelete = result['publicId'];
		}, (error: any) => console.log(error),
			() => {
				this.deleteCloudPicture();
			}
		);
	}

	public saveProfile() {
		this.updateProfileDto = {
			name: this.username,
			photoUrl: this.photo
		}

		this.userService.editUserProfile(this.userid, this.updateProfileDto).subscribe((result: any) => {
			console.log(result)
		}, (error: any) => {
			console.log(error);
		}, () => {
			this.modalService.dismissAll();
		});
	}

	private getDismissReason(reason: any): string {
		if (reason === ModalDismissReasons.ESC) {
			return 'by pressing ESC';
		} else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
			return 'by clicking on a backdrop';
		} else {
			return `with: ${reason}`;
		}
	}

	public addEmoji(event: any) {
		this.message = `${this.message}${event.emoji.native}`;
		this.isEmojiPickerVisible = false;
	}

	private deleteCloudPicture() {
		if (this.publicIdPhotoToDelete)
			if (!this.publicIdPhotoToDelete.includes("assets/")) {
				this.userService.deleteImage(this.userid, this.publicIdPhotoToDelete).subscribe((result: any) => {
				}, (error: any) => {
					console.log(error)
				}, () => {
					// this.publicIdPhotoToDelete = this.photo;
				})
			}
	}

	private updateConnectionList() {
		this.hubService.hubConnection.on('GetYourUsername', (userprofile) => {
			this.username = userprofile.name;
			this.userid = userprofile.id;
			this.photo = userprofile.photoUrl;

			this.publicIdPhotoToDelete = userprofile.imagePublicId;
		});

		this.hubService.hubConnection.on('GetConnectionId', (connectionId) => {
			this.clientConnectionId = connectionId;
		});

		this.hubService.hubConnection.on('UpdateConnectionsList', (connections) => {
			this.connections = connections;

			delete this.connections[this.username];
		});

		this.hubService.hubConnection
			.on('SendMessage', (username: string, photoUrl: any, message: string) => {
				const text = `${username}: ${message}`;
				this.messages.push({ img: photoUrl, message: text });
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