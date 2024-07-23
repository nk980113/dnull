import { EventEmitter } from 'node:events';

import * as D from 'discord-api-types/v10';

const {
    GatewayOpcodes: Op,
} = D;

type LifecycleEmitter = EventEmitter<{
    [K in 'open' | 'hello' | 'heartbeat' | 'heartbeat_ack']: [];
} & { close: [code: number, reason: string] }>;

export type Gateway = LifecycleEmitter & {
    close(): void;
    send<Op extends keyof SendPayloadOpDataMap>(
        op: Op,
        d: SendPayloadOpDataMap[Op],
    ): void;
    dispatch: DispatchEmitter;
};

type SendPayloadOpDataMap = {
    [Payload in D.GatewaySendPayload as Payload['op']]: Payload['d'];
};

type DispatchEmitter = EventEmitter<{
    [Payload in D.GatewayDispatchPayload as Payload['t']]: Payload['d'] extends never ? [] : [Payload['d']];
}>;

export function createGateway(token: string, intents: number): Gateway {
    const ws = new WebSocket('wss://gateway.discord.gg');

    const lifecycle: LifecycleEmitter = new EventEmitter();

    const dispatch: DispatchEmitter = new EventEmitter();

    ws.addEventListener('open', () => {
        lifecycle.emit('open');
    });

    ws.addEventListener('message', (e) => {
        handleMessage(JSON.parse(e.data))
    });

    ws.addEventListener('close', (e) => {
        if (e.code >= 4000) lifecycle.emit('close', e.code, e.reason);
    });

    let seq: number | null = null;

    function handleMessage(data: D.GatewayReceivePayload) {
        if (data.s) {
            seq = data.s;
        }
        switch (data.op) {
            case Op.Hello: {
                lifecycle.emit('hello');
                setInterval(() => {
                    utils.send(Op.Heartbeat, seq);
                    lifecycle.emit('heartbeat');
                }, data.d.heartbeat_interval).unref();
                utils.send(Op.Identify, {
                    token,
                    properties: {
                        os: 'Windows 10',
                        browser: 'dnull',
                        device: 'dnull',
                    },
                    intents,
                });
                break;
            }

            case Op.Dispatch: {
                // @ts-ignore
                dispatch.emit(data.t, data.d);
                break;
            }

            case Op.HeartbeatAck: {
                lifecycle.emit('heartbeat_ack');
            }
        }
    }

    const utils = {
        close() {
            ws.close(1000, '');
        },
        send<Op extends keyof SendPayloadOpDataMap>(
            op: Op,
            d: SendPayloadOpDataMap[Op],
        ) {
            const payload = { op, d };
            ws.send(JSON.stringify(payload));
        },
        dispatch,
    }

    return Object.assign(lifecycle, utils);
}
