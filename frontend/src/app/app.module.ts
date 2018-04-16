import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';

import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {ReactiveFormsModule} from '@angular/forms';
import {ControlPanelComponent} from './control-panel/control-panel.component';
import {NgxEchartsModule} from 'ngx-echarts';
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './user.service';
import {LoginGuard} from './login.guard';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ControlPanelComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        NgxEchartsModule,
        ReactiveFormsModule,
        AppRoutingModule
    ],
    providers: [UserService, LoginGuard],
    bootstrap: [AppComponent]
})
export class AppModule {
}
