const apiBaseUrl = import.meta.env.VITE_API_BASE + '/admin/counterparties' || `${window.location.origin}/admin/counterparties`;

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
export function getCounterparties() {
    return request(apiBaseUrl);
}

// GET /admin/counterparties/{counterpartyId}
export function getCounterparty(counterpartyId) {
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

// POST /admin/counterparties/register
export function addUserToCounterparty(data) {
    return request(`${apiBaseUrl}/users`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
