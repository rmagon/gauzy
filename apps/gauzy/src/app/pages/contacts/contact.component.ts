import { Component, OnInit } from '@angular/core';
import {
	Employee,
	OrganizationContact,
	OrganizationContactCreateInput,
	OrganizationProjects,
	ComponentLayoutStyleEnum
} from '@gauzy/models';
import { NbToastrService, NbDialogService } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { InviteContactComponent } from './invite-contact/invite-contact.component';
import { ActivatedRoute } from '@angular/router';
import { TranslationBaseComponent } from '../../@shared/language-base/translation-base.component';
import { EmployeesService } from '../../@core/services';
import { OrganizationProjectsService } from '../../@core/services/organization-projects.service';
import { OrganizationContactService } from '../../@core/services/organization-contact.service';
import { Store } from '../../@core/services/store.service';
import { ComponentEnum } from '../../@core/constants/layout.constants';

@Component({
	selector: 'ga-contact',
	templateUrl: './contact.component.html',
	styleUrls: ['./contact.component.scss']
})
export class ContactComponent extends TranslationBaseComponent
	implements OnInit {
	private _ngDestroy$ = new Subject<void>();

	organizationId: string;

	showAddCard: boolean;

	organizationContact: OrganizationContact[] = [];

	projectsWithoutOrganizationContact: OrganizationProjects[];

	selectProjects: string[] = [];

	employees: Employee[] = [];

	organizationContactToEdit: OrganizationContact;
	viewComponentName: ComponentEnum;
	dataLayoutStyle = ComponentLayoutStyleEnum.TABLE;
	constructor(
		private readonly organizationContactService: OrganizationContactService,
		private readonly organizationProjectsService: OrganizationProjectsService,
		private readonly toastrService: NbToastrService,
		private readonly store: Store,
		private readonly employeesService: EmployeesService,
		readonly translateService: TranslateService,
		private dialogService: NbDialogService,
		private route: ActivatedRoute
	) {
		super(translateService);
	}

	ngOnInit(): void {
		this.store.selectedOrganization$
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((organization) => {
				if (organization) {
					this.organizationId = organization.id;
					this.loadOrganizationContacts();
					this.loadProjectsWithoutOrganizationContacts();
					this.loadEmployees();
				}
			});

		this.route.queryParamMap
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((params) => {
				if (params.get('openAddDialog')) {
					this.add();
				}
			});
	}

	async removeOrganizationContact(id: string, name: string) {
		await this.organizationContactService.delete(id);

		this.toastrService.primary(
			this.getTranslation(
				'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_CONTACTS.REMOVE_CONTACT',
				{
					name: name
				}
			),
			this.getTranslation('TOASTR.TITLE.SUCCESS')
		);

		this.loadOrganizationContacts();
	}
	setView() {
		this.viewComponentName = ComponentEnum.CONTACTS;
		this.store
			.componentLayout$(this.viewComponentName)
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((componentLayout) => {
				this.dataLayoutStyle = componentLayout;
			});
	}

	private async addOrEditOrganizationContact(
		organizationContact: OrganizationContactCreateInput
	) {
		const contact = {
			country: organizationContact.country,
			city: organizationContact.city,
			address: organizationContact.address
		};
		const organizationContactData = {
			...organizationContact,
			contact
		};
		if (
			organizationContact.name &&
			organizationContact.primaryEmail &&
			organizationContact.primaryPhone
		) {
			await this.organizationContactService.create(
				organizationContactData
			);

			this.showAddCard = !this.showAddCard;
			this.selectProjects = [];

			this.toastrService.primary(
				this.getTranslation(
					'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_CONTACTS.ADD_CONTACT',
					{
						name: organizationContact.name
					}
				),
				this.getTranslation('TOASTR.TITLE.SUCCESS')
			);

			this.loadOrganizationContacts();
		} else {
			this.toastrService.danger(
				this.getTranslation(
					'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_CONTACTS.INVALID_CONTACT_DATA'
				),
				this.getTranslation(
					'TOASTR.MESSAGE.NEW_ORGANIZATION_CONTACT_INVALID_DATA'
				)
			);
		}
	}

	private async loadOrganizationContacts() {
		if (!this.organizationId) {
			return;
		}

		const res = await this.organizationContactService.getAll(
			['projects', 'members', 'members.user', 'tags', 'contact'],
			{
				organizationId: this.organizationId
			}
		);
		if (res) {
			this.organizationContact = res.items;
		}
	}

	private async loadProjectsWithoutOrganizationContacts() {
		const res = await this.organizationProjectsService.getAll(
			['organizationContact'],
			{
				organizationId: this.organizationId,
				organizationContact: null
			}
		);

		if (res) {
			this.projectsWithoutOrganizationContact = res.items;
		}
	}

	private async loadEmployees() {
		if (!this.organizationId) {
			return;
		}

		const { items } = await this.employeesService
			.getAll(['user'], { organization: { id: this.organizationId } })
			.pipe(first())
			.toPromise();

		this.employees = items;
	}

	cancel() {
		this.organizationContactToEdit = null;
		this.showAddCard = !this.showAddCard;
	}

	async editOrganizationContact(organizationContact: OrganizationContact) {
		await this.loadProjectsWithoutOrganizationContacts();
		this.organizationContactToEdit = organizationContact;
		this.showAddCard = true;
	}

	async add() {
		await this.loadProjectsWithoutOrganizationContacts();
		this.organizationContactToEdit = null;
		this.showAddCard = true;
	}

	async invite(selectedOrganizationContact?: OrganizationContact) {
		try {
			const dialog = this.dialogService.open(InviteContactComponent, {
				context: {
					organizationId: this.organizationId,
					organizationContact: selectedOrganizationContact
				}
			});

			const result = await dialog.onClose.pipe(first()).toPromise();

			if (result) {
				await this.loadOrganizationContacts();

				this.toastrService.primary(
					this.getTranslation(
						'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_CONTACTS.INVITE_CONTACT',
						{
							name: result.name
						}
					),
					this.getTranslation('TOASTR.TITLE.SUCCESS')
				);
			}
		} catch (error) {
			this.toastrService.danger(
				this.getTranslation(
					'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_CONTACTS.INVITE_CONTACT_ERROR'
				),
				this.getTranslation('TOASTR.TITLE.ERROR')
			);
		}
	}
}
