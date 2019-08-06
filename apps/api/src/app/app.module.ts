import { Module } from '@nestjs/common';
import { RouterModule } from 'nest-router';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user';
import { EmployeeModule } from './employee';
import { RoleModule } from './role';
import { OrganizationModule } from './organization';
import { IncomeModule } from './income';
import { ExpenseModule } from './expense';
import { EmployeeSettingsModule } from './employee-settings';
import { CoreModule } from './core';
import { AuthModule } from './auth';
import { SeedDataService } from './core/seeds/SeedDataService';
import { UserOrganizationModule } from './user-organization';
import { EmployeeStatisticsModule } from './employee-statistics';

@Module({
  imports: [
    RouterModule.forRoutes([
      {
        path: '',
        children: [
          { path: '/auth', module: AuthModule },
          { path: '/user', module: UserModule },
          { path: '/role', module: RoleModule },
          { path: '/organization', module: OrganizationModule },
          { path: '/income', module: IncomeModule },
          { path: '/expense', module: ExpenseModule },
          { path: '/employee', module: EmployeeModule },
          { path: '/employee-settings', module: EmployeeSettingsModule },
          { path: '/employee-statistics', module: EmployeeStatisticsModule },
          { path: '/user-organization', module: UserOrganizationModule },
        ],
      },
    ]),
    CoreModule,
    AuthModule,
    UserModule,
    EmployeeModule,
    EmployeeSettingsModule,
    EmployeeStatisticsModule,
    RoleModule,
    OrganizationModule,
    IncomeModule,
    ExpenseModule,
    UserOrganizationModule
  ],
  controllers: [AppController],
  providers: [AppService, SeedDataService]
})
export class AppModule {    
}