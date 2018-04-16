import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UserService} from '../user.service';

declare var TextDecoder;
import * as io from 'socket.io-client';

@Component({
    selector: 'app-control-panel',
    templateUrl: './control-panel.component.html',
    styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent implements OnInit {

    memory: any;
    ramvalue: any;
    cpu: any;
    cpuvalue: any;
    link: string;
    percentRam: number;
    percentCpu: number;
    cpu5m: number;
    cpu15m: number;
    totalcores: number;
    freeram: string;
    usedram: string;
    totalram: string;
    started: boolean;
    reloading: boolean;
    headBlock: number;
    irrBlock: number;
    myBlock: number;
    headProd: string;
    yourName: string;
    canStop: boolean;
    showLogs: boolean;
    logs: any[];
    logsPaused: boolean;
    socket: any;

    constructor(private http: HttpClient, private user: UserService) {
        this.link = 'https://' + window.location.host;
        const iofn = (io as any).default ? (io as any).default : io;
        this.socket = iofn(this.link, {});
        this.percentRam = 0;
        this.headBlock = 0;
        this.canStop = true;
        this.started = false;
        this.showLogs = false;
        this.logsPaused = false;
        this.logs = [];
        this.getMemoryUsage();
        setInterval(() => {
            this.getMemoryUsage();
        }, 5000);
    }

    ngOnInit() {
        this.socket.emit('join', {room: 'blocks'});
        this.socket.on('block', (data) => {
            this.started = true;
            this.headBlock = data.head_block_num;
            this.irrBlock = data.last_irreversible_block_num;
            this.myBlock = data.last_produced;
            this.headProd = data.head_producer;
            this.yourName = data.your_producer;
        });
        this.socket.on('reconnect', () => {
            this.socket.emit('join', {room: 'blocks'});
        });
        this.socket.on('disconnect', () => {
            this.started = false;
            this.canStop = true;
        });
        this.memory = {
            tooltip: {
                formatter: '{a} <br/>{b} : {c}%'
            },
            title: {
                text: 'RAM',
                bottom: '10% ',
                left: '41%',
            },
            series: [
                {
                    radius: '100%',
                    name: 'memory usage',
                    type: 'gauge',
                    detail: {
                        formatter: '{value}%',
                        fontSize: 20,
                    },
                    data: [{value: 50}],
                    axisLine: {
                        lineStyle: {
                            width: 10
                        }
                    },
                    axisTick: {            // 坐标轴小标记
                        length: 15,        // 属性length控制线长
                        lineStyle: {       // 属性lineStyle控制线条样式
                            color: 'auto'
                        }
                    },
                    splitLine: {           // 分隔线
                        length: 15,         // 属性length控制线长
                        lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                            color: 'auto'
                        }
                    },
                }
            ]
        };
        this.cpu = {
            tooltip: {
                formatter: '{a} <br/>{b} : {c}%'
            },
            title: {
                text: 'CPU',
                bottom: '10% ',
                left: '43%',
            },
            series: [
                {
                    radius: '100%',
                    name: 'cpu usage',
                    type: 'gauge',
                    detail: {
                        formatter: '{value}%',
                        fontSize: 20,
                    },
                    data: [{value: 50}],
                    axisLine: {
                        lineStyle: {
                            width: 10
                        }
                    },
                    axisTick: {
                        length: 15,
                        lineStyle: {
                            color: 'auto'
                        }
                    },
                    splitLine: {
                        length: 15,
                        lineStyle: {
                            color: 'auto'
                        }
                    },
                }
            ]
        };
    }

    getMemoryUsage() {
        this.http.get(this.link + '/stats').subscribe((data: any) => {
            this.percentRam = Math.round(((data.totalram - data.freeram) / data.totalram) * 1000) / 10;
            this.freeram = Math.round((data.freeram / 1000000000) * 10) / 10 + 'GB';
            this.usedram = Math.round(((data.totalram - data.freeram) / 1000000000) * 10) / 10 + 'GB';
            this.totalram = Math.round((data.totalram / 1000000000) * 10) / 10 + 'GB';
            this.totalcores = data.cores.length;
            this.percentCpu = Math.round(((data.cpu[0] / this.totalcores)) * 1000) / 10;
            this.cpu5m = Math.round(((data.cpu[1] / this.totalcores)) * 1000) / 10;
            this.cpu15m = Math.round(((data.cpu[2] / this.totalcores)) * 1000) / 10;

            this.ramvalue = {
                series: [
                    {
                        data: [{value: this.percentRam}]
                    }
                ],
            };
            this.cpuvalue = {
                series: [
                    {
                        data: [{value: this.percentCpu}]
                    }
                ],
            };
        });
    }

    start() {
        this.canStop = false;
        const data = {
            user: this.user.user,
            pass: this.user.pass,
        };
        this.http.post(this.link + '/start', data).subscribe((response: any) => {
            if (response.status === 'OK') {
                this.started = true;
                this.canStop = true;
            }
        });
    }

    stop() {
        this.canStop = false;
        const data = {
            user: this.user.user,
            pass: this.user.pass,
        };
        this.http.post(this.link + '/stop', data).subscribe((response: any) => {
            if (response.status === 'OK') {
                this.started = false;
            }
        });
    }

    reload() {
        this.reloading = true;
        this.started = false;
        const data = {
            user: this.user.user,
            pass: this.user.pass,
        };
        this.http.post(this.link + '/reload', data).subscribe((response: any) => {
            this.reloading = false;
            if (response.status === 'OK') {
                this.started = true;
            }
        });
    }

    getLogs() {
        this.showLogs = true;
        setTimeout(() => {
            const el = document.querySelector('#logsSec');
            el.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 0);
        if (this.logsPaused === false) {
            const dec = new TextDecoder('utf-8');
            this.socket.emit('join', {room: 'logs'});
            this.socket.on('log', (data) => {
                const str = dec.decode(data);
                str.split('\n').forEach((line) => {
                    const txt = line.trim();
                    if (txt !== '') {
                        this.logs.unshift(line);
                    }
                });
            });
        }
    }

    pauseLogs() {
        this.logsPaused = true;
        this.socket.emit('leave', {room: 'logs'});
    }

    clearLogs() {
        this.logs = [];
    }

    resumeLogs() {
        this.logsPaused = false;
        this.socket.emit('join', {room: 'logs'});
    }

    hideLogs() {
        this.showLogs = false;
        this.pauseLogs();
    }
}
