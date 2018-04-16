import {Injectable} from '@angular/core';

@Injectable()
export class UserService {
    get user(): string {
        return this._user;
    }

    set user(value: string) {
        this._user = value;
    }

    get pass(): string {
        return this._pass;
    }

    set pass(value: string) {
        this._pass = value;
    }

    private _user: string;
    private _pass: string;

    constructor() {
        this._user = '';
        this._pass = '';
    }

}
