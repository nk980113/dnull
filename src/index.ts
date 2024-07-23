import { token } from './token';
import { createGateway } from './gateway';
import { request } from './rest';
import { GatewayDispatchEvents as Events } from 'discord-api-types/v10';
import * as D from 'discord-api-types/v10';

const gateway = createGateway(token, 1); // 1 means GUILDS intent

gateway.on('close', (code, reason) => {
    console.log(`WEBSOCKET CLOSED [${code}]: ${reason}`);
});

// Use gateway.dispatch.on(Events._____, (e) => {}) like normal discord.js code
