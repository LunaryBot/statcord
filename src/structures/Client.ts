import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import systeminformation from 'systeminformation';
import os from 'os';

import { BotStatsData, ClientOptions, StatsPayloadRequestData } from '../../typings';

import { ApiVersions } from '../utils/Constants';

class Client extends EventEmitter {
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
    
    public declare key: string;
    public botId: string;
    public options: ClientOptions;
    public api: AxiosInstance;

    public bandwidthUsage: number;

    public activedUsers: Array<string>;
    public commandsRunneds: number;
    public popularCommands: Array<{ name: string, count: number }>;
    public customFields: Map<1 | 2, string | number>

    constructor(key: string, botId: string, options?: ClientOptions) {
        super();
        
        Object.defineProperty(this, 'key', {
            value: key,
            writable: false,
            enumerable: false,
            configurable: false
        });

        this.botId = botId;

        this.options = options || {};

        this.api = axios.create({
            baseURL: this.options.baseUrl || ApiVersions.v3,
            headers: {
                "Content-Type": "application/json",
                Authorization: this.key,
            }
        });

        this.bandwidthUsage = 0;

        this.activedUsers = [];
        this.commandsRunneds = 0;
        this.popularCommands = [];
        this.customFields = new Map([[1, '0'], [2, '0']]);
    }

    /**
     * Add command to the popular commands.
     * @param {string} commandName The command name to add to the popular commands. 
     * @param {string} userId The user id to add to the actived users.
     * @returns {{name: string, count: number}}
     */
    addCommand(commandName: string, userId: string) {
        if (typeof commandName !== 'string') {
            throw new Error('The commandName must be a string.');
        }

        if (typeof userId !== 'string') {
            throw new Error('The userId must be a string.');
        }

        if (!this.activedUsers.includes(userId)) {
            this.activedUsers.push(userId);
        }

        this.commandsRunneds++;

        let command: { name: string, count: number } | undefined = this.popularCommands.find(c => c.name === commandName);

        if (!command) {
            command = { name: commandName, count: 1 };
            this.popularCommands.push(command);
        } else {
            command.count++;
        }

        return command;
    }

    /**
     * Get bot stats.
     * @param {string} botId The bot id to send the stats to.
     */
    public async getStats(botId: string = this.botId as string) {
        if (typeof botId !== 'string') {
            throw new Error('The botId must be a string.');
        }

        const response = await this.api.get(`/${botId}`).catch(e => e.response);

        if (response.status === 200) {
            return response.data.data as Array<BotStatsData>;
        }

        throw new Error(response.statusText);
    }

    /**
     * Post the stats to the api.
     * @param {StatsPayloadRequestData} data The data to send to the API.
     * @returns {Promise<void>}
    */
    public async post(data: {
        guildsCount: number,
        usersCount: number,
        memoryActive?: number,
        memoryUsed?: number,
        cpuload?: number,
        bandwidth?: number,
    }): Promise<void|never> {
        if (typeof data.guildsCount !== 'number' || typeof data.usersCount !== 'number') {
            throw new Error('The guildsCount and usersCount must be numbers.');
        };

        let bandwidth = 0;

        if (this.options.postNetworkStatistics) {
            bandwidth = data.bandwidth || this.bandwidthUsage;

            if(bandwidth <= 0) {
                bandwidth = (await systeminformation.networkStats()).reduce((prev: number, current: systeminformation.Systeminformation.NetworkStatsData) => prev + current.rx_bytes, 0);
            } else {
                const currentBandwidth = (await systeminformation.networkStats()).reduce((prev: number, current: systeminformation.Systeminformation.NetworkStatsData) => prev + current.rx_bytes, 0);
                bandwidth = currentBandwidth - bandwidth;
            };

            this.bandwidthUsage = bandwidth;
        }

        let cpuload = 0;

        if (this.options.postCpuStatistics) {
            if(data.cpuload) {
                cpuload = data.cpuload;
            } else {
                const platform = os.platform();

                if (platform !== "freebsd" && platform !== "netbsd" && platform !== "openbsd") {
                    cpuload = (await systeminformation.currentLoad()).currentLoad;
                }
            }

            cpuload = Math.round(cpuload);
        }

        let memactive = 0;
        let memload = 0;

        if (this.options.postMemoryStatistics) {
            if(data.memoryActive) {
                memactive = data.memoryActive;
            }

            if(data.memoryUsed) {
                memload = data.memoryUsed;
            }

            if(!data.memoryUsed || !data.memoryUsed) {
                const memory = await systeminformation.mem();
                
                if (!data.memoryActive) {
                    memactive = memory.active;
                }

                if (!data.memoryUsed) {
                    memload = Math.round(memory.active / memory.total * 100)
                }
            }
        }

        const popular = this.popularCommands.sort((a, b) => a.count - b.count).reverse().splice(0, 5);

        const payload: StatsPayloadRequestData = {
            id: this.botId,
            servers: data.guildsCount.toString(),
            users: data.usersCount.toString(),
            active: this.activedUsers,
            commands: this.commandsRunneds.toString(),
            popular,
            memactive: memactive.toString(),
            memload: memload.toString(),
            cpuload: cpuload.toString(),
            bandwidth: bandwidth.toString(),
            custom1: this.customFields.get(1) || '0',
            custom2: this.customFields.get(2) || '0',
        } as any;

        const response = await this.api.post('/stats', JSON.stringify({ ...payload, key: this.key })).catch(e => e.response as AxiosResponse);

        if (response.status >= 500 || response.status === 400 || response.status === 429) {
            throw new Error(JSON.stringify(response.data));
        }

        if (response.status === 200) {
            this.emit('postStats', payload);

            this.activedUsers = [];
            this.commandsRunneds = 0;
            this.popularCommands = [];
            this.customFields.clear();
            this.customFields.set(1, '0');
            this.customFields.set(2, '0');
            
            return;
        }
    }
}

export default Client;