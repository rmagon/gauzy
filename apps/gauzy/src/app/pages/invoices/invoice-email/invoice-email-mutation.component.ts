import { Component } from '@angular/core';
import { TranslationBaseComponent } from '../../../@shared/language-base/translation-base.component';
import { OnInit } from '@angular/core';
import {
	Invoice,
	InvoiceTypeEnum,
	InvoiceStatusTypesEnum
} from '@gauzy/models';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { InvoicesService } from '../../../@core/services/invoices.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { EmployeesService } from '../../../@core/services';
import { OrganizationProjectsService } from '../../../@core/services/organization-projects.service';
import { TasksService } from '../../../@core/services/tasks.service';
import { ProductService } from '../../../@core/services/product.service';
import { generatePdf } from '../../../@shared/invoice/generate-pdf';
import { ExpensesService } from '../../../@core/services/expenses.service';

@Component({
	selector: 'ga-invoice-email',
	templateUrl: './invoice-email-mutation.component.html'
})
export class InvoiceEmailMutationComponent extends TranslationBaseComponent
	implements OnInit {
	invoice: Invoice;
	form: FormGroup;
	isEstimate: boolean;

	constructor(
		readonly translateService: TranslateService,
		protected dialogRef: NbDialogRef<InvoiceEmailMutationComponent>,
		private fb: FormBuilder,
		private toastrService: NbToastrService,
		private employeeService: EmployeesService,
		private projectService: OrganizationProjectsService,
		private taskService: TasksService,
		private productService: ProductService,
		private invoiceService: InvoicesService,
		private expensesService: ExpensesService
	) {
		super(translateService);
	}

	ngOnInit() {
		this.initializeForm();
	}

	initializeForm() {
		this.form = this.fb.group({
			email: ['', Validators.required]
		});
	}

	async sendEmail() {
		pdfMake.vfs = pdfFonts.pdfMake.vfs;
		let docDefinition;
		let service;

		switch (this.invoice.invoiceType) {
			case InvoiceTypeEnum.BY_EMPLOYEE_HOURS:
				service = this.employeeService;
				break;
			case InvoiceTypeEnum.BY_PROJECT_HOURS:
				service = this.projectService;
				break;
			case InvoiceTypeEnum.BY_TASK_HOURS:
				service = this.taskService;
				break;
			case InvoiceTypeEnum.BY_PRODUCTS:
				service = this.productService;
				break;
			case InvoiceTypeEnum.BY_EXPENSES:
				service = this.expensesService;
				break;
			default:
				break;
		}

		docDefinition = await generatePdf(
			this.invoice,
			this.invoice.fromOrganization,
			this.invoice.toContact,
			service
		);

		const pdfDocGenerator = pdfMake.createPdf(docDefinition);
		pdfDocGenerator.getBase64(async (data) => {
			await this.invoiceService.sendEmail(
				this.form.value.email,
				data,
				this.invoice.invoiceNumber,
				this.invoice.id,
				this.isEstimate
			);
		});

		if (this.invoice.id) {
			await this.invoiceService.update(this.invoice.id, {
				status: InvoiceStatusTypesEnum.SENT
			});
		}

		this.toastrService.primary(
			this.getTranslation('INVOICES_PAGE.EMAIL.EMAIL_SENT'),
			this.getTranslation('TOASTR.TITLE.SUCCESS')
		);
		this.dialogRef.close('ok');
	}

	cancel() {
		this.dialogRef.close();
	}
}
