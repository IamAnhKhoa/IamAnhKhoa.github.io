const TOKEN_ENDPOINTS = {
    production: 'https://egw.baohiemxahoi.gov.vn/api/token/take',
    training: 'https://daotaoegw.baohiemxahoi.gov.vn/api/token/take'
};

const LOOKUP_ENDPOINTS = {
    production: 'http://egw.baohiemxahoi.gov.vn/api/TraCuuCCT/TraCuuTienMCCT',
    training: 'http://daotaoegw.baohiemxahoi.gov.vn/api/TraCuuCCT/TraCuuTienMCCT'
};

function normalizeEnvironment(environment) {
    return environment === 'training' ? 'training' : 'production';
}

function getAllowedOrigin(request, env) {
    const requestOrigin = request.headers.get('Origin') || '*';
    const allowed = String(env.ALLOWED_ORIGINS || '*').split(',').map(item => item.trim()).filter(Boolean);
    if (allowed.includes('*') || allowed.includes(requestOrigin)) return requestOrigin;
    return allowed[0] || '*';
}

function corsHeaders(request, env) {
    return {
        'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, accessToken, tokenId, passwordHash',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function jsonResponse(request, env, status, payload) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...corsHeaders(request, env),
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}

async function readJson(request) {
    try {
        return await request.json();
    } catch {
        throw new Error('Body gửi lên proxy không phải JSON hợp lệ.');
    }
}

async function forwardGateway(request, env, gatewayUrl, init) {
    const response = await fetch(gatewayUrl, init);
    return new Response(response.body, {
        status: response.status,
        headers: {
            ...corsHeaders(request, env),
            'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8'
        }
    });
}

async function handleToken(request, env) {
    const payload = await readJson(request);
    const environment = normalizeEnvironment(payload.environment);
    const username = String(payload.username || '').trim();
    const passwordHash = String(payload.passwordHash || '').trim();

    if (!username || !passwordHash) {
        return jsonResponse(request, env, 400, { error: 'Thiếu username hoặc passwordHash.' });
    }

    return forwardGateway(request, env, TOKEN_ENDPOINTS[environment], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordHash })
    });
}

async function handleLookup(request, env) {
    const payload = await readJson(request);
    const environment = normalizeEnvironment(payload.environment);
    const requestHeaders = payload.headers || {};
    const requestBody = payload.body || {};

    return forwardGateway(request, env, LOOKUP_ENDPOINTS[environment], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            accessToken: String(requestHeaders.accessToken || ''),
            tokenId: String(requestHeaders.tokenId || ''),
            passwordHash: String(requestHeaders.passwordHash || '')
        },
        body: JSON.stringify(requestBody)
    });
}

export default {
    async fetch(request, env) {
        try {
            if (request.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: corsHeaders(request, env) });
            }

            const url = new URL(request.url);
            if (request.method === 'GET' && url.pathname === '/health') {
                return jsonResponse(request, env, 200, { ok: true, service: 'mcct-worker' });
            }

            if (request.method === 'POST' && url.pathname === '/mcct/token') {
                return handleToken(request, env);
            }

            if (request.method === 'POST' && url.pathname === '/mcct/lookup') {
                return handleLookup(request, env);
            }

            return jsonResponse(request, env, 404, { error: 'Không tìm thấy endpoint proxy.' });
        } catch (error) {
            return jsonResponse(request, env, 500, { error: error.message || String(error) });
        }
    }
};
