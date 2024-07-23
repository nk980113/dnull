export function request<Req extends object>(relativePath: string, token: string, method?: string, body?: Req): Promise<Response> {
    if (relativePath[0] !== '/') relativePath = '/' + relativePath;
    return fetch(`https://discord.com/api/v10${relativePath}`, {
        body: body ? JSON.stringify(body) : body,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        method,
    });
}