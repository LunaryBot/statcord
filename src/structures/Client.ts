import { ClientOptions } from '../../typings';
import axios, { AxiosInstance } from 'axios';
import { ApiVersions } from '../utils/Constants';

class Client {
    public declare key: string;
    public declare options: ClientOptions;
    public declare api: AxiosInstance;

    /**
     * @param {string} key
     * @param {ClientOptions} data The data to initialize the client with.
     */
    constructor(key: string, options?: ClientOptions) {
        Object.defineProperty(this, 'key', {
            value: key,
            writable: false,
            enumerable: false,
            configurable: false
        });

        this.options = options || {};

        this.api = axios.create({
            baseURL: this.options.baseUrl || ApiVersions.v3,
            headers: {
                Authorization: this.key,
            }
        });
    }
}

export default Client;