import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {ControlPanelComponent} from './control-panel/control-panel.component';
import {LoginGuard} from './login.guard';

const routes: Routes = [
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'control',
        component: ControlPanelComponent,
        canActivate: [LoginGuard],
    },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
