/** Declaration file generated by dts-gen */

export = koa_generic_session_mongo;

declare class koa_generic_session_mongo {
    constructor(...args: any[]);

    destroy(sid: any): any;

    get(sid: any): any;

    set(sid: any, sess: any, ttl: any): any;

    static defaultMaxListeners: number;

    static init(): void;

    static listenerCount(emitter: any, type: any): any;

    static usingDomains: boolean;

}

declare namespace koa_generic_session_mongo {
    class EventEmitter {
        constructor();

        addListener(type: any, listener: any): any;

        emit(type: any, args: any): any;

        eventNames(): any;

        getMaxListeners(): any;

        listenerCount(type: any): any;

        listeners(type: any): any;

        off(type: any, listener: any): any;

        on(type: any, listener: any): any;

        once(type: any, listener: any): any;

        prependListener(type: any, listener: any): any;

        prependOnceListener(type: any, listener: any): any;

        rawListeners(type: any): any;

        removeAllListeners(type: any, ...args: any[]): any;

        removeListener(type: any, listener: any): any;

        setMaxListeners(n: any): any;

        static EventEmitter: any;

        static defaultMaxListeners: number;

        static init(): void;

        static listenerCount(emitter: any, type: any): any;

        static usingDomains: boolean;

    }

}

