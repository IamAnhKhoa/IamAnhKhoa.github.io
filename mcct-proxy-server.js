const http = require('http');
const https = require('https');

const PORT = Number(process.env.MCCT_PROXY_PORT || 7979);
const HOST = '127.0.0.1';

const TOKEN_ENDPOINTS = {
    production: 'https://egw.baohiemxahoi.gov.vn/api/token/take',
    training: 'https://daotaoegw.baohiemxahoi.gov.vn/api/token/take'
};

const LOOKUP_ENDPOINTS = {
    production: 'http://egw.baohiemxahoi.gov.vn/api/TraCuuCCT/TraCuuTienMCCT',
    training: 'http://daotaoegw.baohiemxahoi.gov.vn/api/TraCuuCCT/TraCuuTienMCCT'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, accessToken, tokenId, passwordHash'
    });
    res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                reject(new Error('Request quá lớn.'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function parseJsonBody(rawBody) {
    if (!rawBody) return {};
    try {
        return JSON.parse(rawBody);
    } catch {
        throw new Error('Body gửi lên proxy không phải JSON hợp lệ.');
    }
}

function requestGateway(targetUrl, options) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);
        const client = url.protocol === 'https:' ? https : http;
        const body = options.body || '';
        const headers = {
            ...options.headers,
            'Content-Length': Buffer.byteLength(body)
        };

        const gatewayReq = client.request({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: `${url.pathname}${url.search}`,
            method: options.method || 'POST',
            headers,
            timeout: 30000
        }, gatewayRes => {
            let responseText = '';
            gatewayRes.setEncoding('utf8');
            gatewayRes.on('data', chunk => responseText += chunk);
            gatewayRes.on('end', () => {
                resolve({
                    statusCode: gatewayRes.statusCode || 0,
                    headers: gatewayRes.headers,
                    body: responseText
                });
            });
        });

        gatewayReq.on('timeout', () => {
            gatewayReq.destroy(new Error('Cổng BHXH phản hồi quá thời gian chờ.'));
        });
        gatewayReq.on('error', reject);
        gatewayReq.write(body);
        gatewayReq.end();
    });
}

function normalizeEnvironment(environment) {
    return environment === 'training' ? 'training' : 'production';
}

async function handleToken(req, res) {
    const payload = parseJsonBody(await readRequestBody(req));
    const environment = normalizeEnvironment(payload.environment);
    const username = String(payload.username || '').trim();
    const passwordHash = String(payload.passwordHash || '').trim();

    if (!username || !passwordHash) {
        sendJson(res, 400, { error: 'Thiếu username hoặc passwordHash.' });
        return;
    }

    const gateway = await requestGateway(TOKEN_ENDPOINTS[environment], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordHash })
    });

    res.writeHead(gateway.statusCode, {
        'Content-Type': gateway.headers['content-type'] || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(gateway.body);
}

async function handleLookup(req, res) {
    const payload = parseJsonBody(await readRequestBody(req));
    const environment = normalizeEnvironment(payload.environment);
    const requestHeaders = payload.headers || {};
    const requestBody = payload.body || {};

    const gateway = await requestGateway(LOOKUP_ENDPOINTS[environment], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            accessToken: String(requestHeaders.accessToken || ''),
            tokenId: String(requestHeaders.tokenId || ''),
            passwordHash: String(requestHeaders.passwordHash || '')
        },
        body: JSON.stringify(requestBody)
    });

    res.writeHead(gateway.statusCode, {
        'Content-Type': gateway.headers['content-type'] || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(gateway.body);
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'OPTIONS') {
            sendJson(res, 204, {});
            return;
        }

        if (req.method === 'GET' && req.url === '/health') {
            sendJson(res, 200, { ok: true, service: 'mcct-proxy' });
            return;
        }

        if (req.method === 'POST' && req.url === '/mcct/token') {
            await handleToken(req, res);
            return;
        }

        if (req.method === 'POST' && req.url === '/mcct/lookup') {
            await handleLookup(req, res);
            return;
        }

        sendJson(res, 404, { error: 'Không tìm thấy endpoint proxy.' });
    } catch (error) {
        sendJson(res, 500, { error: error.message || String(error) });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`MCCT proxy dang chay tai http://${HOST}:${PORT}`);
    console.log('Giu cua so nay mo trong luc tra cuu ho so.');
});
