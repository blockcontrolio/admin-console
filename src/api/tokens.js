const apiBaseUrl = (import.meta.env.VITE_API_BASE || window.location.origin) + '/admin/tokens';

function loadAuthToken() {
    return localStorage.getItem('x-api-key');
}

async function request(url, options = {}) {
    let token = loadAuthToken();
    if (!token) {
        throw new Error('Token not set!')
    }
    const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': token,
        ...(options.headers || {})
    };

    const response = await fetch(url, {...options, headers});

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorBody}`);
    }

    // PATCH returns no body (void), so guard this
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }

    return await response.json();
}

// GET /admin/tokens
export function fetchTokens() {
    return request(apiBaseUrl);
}

// PATCH /admin/tokens/{tokenId}
export function updateTokenActivation(tokenId, active) {
    return request(`${apiBaseUrl}/${tokenId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active })
    });
}
