import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {UserService} from '../user.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    link: string;
    alert: string;

    constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private user: UserService) {
        this.link = 'https://' + window.location.host;
        this.alert = '';

        this.loginForm = this.fb.group({
            user: ['', Validators.required],
            pass: ['', Validators.required]
        });
    }

    ngOnInit() {
    }

    login() {
        const data = this.loginForm.value;
        this.http.post(this.link + '/login', data).subscribe((response: any) => {
            if (response.status === 'OK') {
                this.alert = '';
                this.user.user = data.user;
                this.user.pass = data.pass;
                this.router.navigate(['control']);
            }
        }, () => {
            this.alert = 'err';
        });
    }

}
