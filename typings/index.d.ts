import type { AxiosInstance } from "axios";
import type { EventEmitter } from "events";

export interface BotStatsData {
    time: number;
    servers: string;
    users: string;
    active: Array<string>,
    commands: string;
    popular: Array<{ name: string, count: string }>;
    memactive: string;
    memload: string;
    cpuload: string;
    bandwidth: string;
    custom1: string;
    custom2: string;
    count: number;
    votes: number;
}

export interface ClientOptions {
    baseUrl?: string;
    postCpuStatistics?: boolean;
    postMemoryStatistics?: boolean;
    postNetworkStatistics?: boolean;
}

export interface StatsPayloadRequestData {
    id: string;
    servers: string;
    users: string;
    active: Array<string>,
    commands: number;
    popular: Array<{ name: string, count: number }>;
    memactive: string;
    memload: string;
    cpuload: string;
    bandwidth: string;
    custom1: string;
    custom2: string;
}


export class Client extends EventEmitter {
    constructor(key: string, botId: string, options?: ClientOptions);
    public on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    public once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    public emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;

    public get key(): string;
    public options: ClientOptions;
    public api: AxiosInstance;

    public bandwidthUsage: number;

    public activedUsers: Array<string>;
    public commandsRunneds: number;
    public popularCommands: Array<{ name: string, count: number }>;
    public customFields: Map<1 | 2, string | number>
    
    public post(data: { guildsCount: number, usersCount: number, memoryActive?: number, memoryUsed?: number, cpuload?: number, bandwidth?: number }): Promise<void>;
    public addCommand(commandName: string, userId: string): { name: string, count: number };
}

interface ClientEvents {
    postStats: [StatsPayloadRequestData];
}