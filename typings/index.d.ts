import type { AxiosInstance } from "axios";
import type { EventEmitter } from "stream";

export interface ClientOptions {
    baseUrl?: string;
    botId?: string;
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
    /**
     * @extends EventEmitter
     * @param {string} key
     * @param {ClientOptions} data The data to initialize the client with.
     * @returns {Client}
     * @constructor
     * @memberof Client
     * @example
     * const client = new Client(process.env.key, {
     *      botId: process.env.botId,
     *      baseUrl: process.env.baseUrl,
     * });
     */

    public get key(): string;
    public options: ClientOptions;
    public api: AxiosInstance;

    public bandwidthUsage: number;

    public activedUsers: Array<string>;
    public commandsRunneds: number;
    public popularCommands: Array<{ name: string, count: number }>;
    public customFields: Map<1 | 2, string | number>
    
    public post(data: { guildsCount: number, usersCount: number, memoryActive?: number, memoryUsed?: number, cpuload?: number, bandwidth?: number }): Promise<void>;
}