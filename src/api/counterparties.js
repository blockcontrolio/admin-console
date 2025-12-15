const apiBaseUrl = (import.meta.env.VITE_API_BASE || window.location.origin) + '/admin/counterparties';

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

// GET /admin/counterparties
export function fetchCounterparties() {
    return request(apiBaseUrl);
}

// GET /admin/counterparties/providers
export function fetchProviders() {
    return request(`${apiBaseUrl}/providers`);
}

// GET /admin/counterparties/{counterpartyId}
export function fetchCounterparty(counterpartyId) {
    return request(`${apiBaseUrl}/${counterpartyId}`);
}

// POST /admin/counterparties
export function createCounterparty(data) {
    return request(apiBaseUrl, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// EDIT /admin/counterparties/{counterpartyId}
export function updateCounterparty(counterpartyId, data) {
    return request(`${apiBaseUrl}/${counterpartyId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// GET /admin/counterparties/{counterpartyId}/users
export function fetchUsersInCounterparty(counterpartyId) {
    return request(`${apiBaseUrl}/${counterpartyId}/users`, {
        method: 'GET'
    });
}

// POST /admin/counterparties/{counterpartyId}/users
export function addUserToCounterparty(counterpartyId, data) {
    return request(`${apiBaseUrl}/${counterpartyId}/users`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// PATCH /admin/counterparties/{counterpartyId}/users
export function editUserInCounterparty(counterpartyId, data) {
    return request(`${apiBaseUrl}/${counterpartyId}/users`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// GET /admin/counterparties/parameters
export function fetchParameters(provider) {
    if (provider) {
        return request(`${apiBaseUrl}/parameters?provider=${provider}`);
    }
    return request(`${apiBaseUrl}/parameters`);
}

// DELETE /admin/counterparties/{counterpartyId}/parameters
export function deleteParameters(counterpartyId, parameters) {
    return request(`${apiBaseUrl}/${counterpartyId}/parameters`, {
        method: 'DELETE',
        body: JSON.stringify(parameters)
    });
}
