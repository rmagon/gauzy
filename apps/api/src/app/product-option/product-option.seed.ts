import { Connection } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Organization } from '@gauzy/models';
import { ProductOption } from './product-option.entity';
import * as faker from 'faker';
import { ProductCategory } from '../product-category/product-category.entity';
import { Product } from '../product/product.entity';

export const createRandomProductOption = async (
	connection: Connection,
	tenants: Tenant[],
	tenantOrganizationsMap: Map<Tenant, Organization[]>,
	numberOfOptionPerProduct
): Promise<ProductOption[]> => {
	if (!tenantOrganizationsMap) {
		console.warn(
			'Warning: tenantOrganizationsMap not found, Product Options  will not be created'
		);
		return;
	}

	const productOptions: ProductOption[] = [];

	for (const tenant of tenants) {
		const tenantOrgs = tenantOrganizationsMap.get(tenant);
		for (const tenantOrg of tenantOrgs) {
			const productCategories = await connection.manager.find(
				ProductCategory,
				{
					where: [{ organization: tenantOrg }]
				}
			);
			for (const productCategory of productCategories) {
				const products = await connection.manager.find(Product, {
					where: [{ category: productCategory }]
				});
				for (const product of products) {
					for (let i = 0; i <= numberOfOptionPerProduct; i++) {
						const productOption = new ProductOption();

						productOption.name = faker.company.companyName();
						productOption.code = product.code;
						productOption.product = product;

						productOptions.push(productOption);
					}
				}
			}
		}
	}

	await connection.manager.save(productOptions);
};
