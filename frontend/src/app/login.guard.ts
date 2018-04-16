import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {UserService} from './user.service';

@Injectable()
export class LoginGuard implements CanActivate {

    constructor(private router: Router, private user: UserService) {

    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        if (this.user.user !== '' && this.user.pass !== '') {
            return true;
        } else {
            alert('Login required!');
            this.router.navigateByUrl('/');
            return false;
        }
    }
}
