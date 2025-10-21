const apiBaseUrl = (import.meta.env.VITE_API_BASE || window.location.origin) + '/admin/networks';

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

    return await response.json();
}

// GET /admin/networks
export function fetchNetworks() {
    return request(apiBaseUrl);
}

export function fetchParameters() {
    return request(`${apiBaseUrl}/parameters`);
}

// GET /admin/networks/{networkId}
export function fetchNetworkById(networkId) {
    return request(`${apiBaseUrl}/${networkId}`);
}

// POST /admin/networks
export function createNetwork(data) {
    return request(apiBaseUrl, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// PUT /admin/networks/{networkId}
export function updateNetwork(networkId, data) {
    return request(`${apiBaseUrl}/${networkId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// DELETE /admin/networks/{networkId}/parameters
export function deleteParameters(networkId, parameters) {
    return request(`${apiBaseUrl}/${networkId}/parameters`, {
        method: 'DELETE',
        body: JSON.stringify(parameters)
    });
}

