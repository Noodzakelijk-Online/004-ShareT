/**
 * High-Performance HTTP Client using Undici
 * 65% faster than axios with connection pooling
 * GitHub: https://github.com/nodejs/undici (7.4k+ stars)
 */

const { request, Agent, Pool } = require('undici');

// Create a persistent agent with connection pooling
const agent = new Agent({
  keepAliveTimeout: 30000,      // Keep connections alive for 30s
  keepAliveMaxTimeout: 60000,   // Max keep-alive time
  connections: 10,              // Max connections per origin
  pipelining: 1                 // HTTP/1.1 pipelining
});

// Create a dedicated pool for Trello API
const trelloPool = new Pool('https://api.trello.com', {
  connections: 5,
  pipelining: 1,
  keepAliveTimeout: 30000
});

/**
 * Fetch JSON data from a URL
 * @param {string} url - The URL to fetch
 * @param {object} options - Request options
 * @returns {Promise<object>} - Parsed JSON response
 */
async function fetchJSON(url, options = {}) {
  const { body, statusCode, headers } = await request(url, {
    method: 'GET',
    dispatcher: agent,
    ...options
  });
  
  if (statusCode >= 400) {
    const errorBody = await body.text();
    const error = new Error(`HTTP ${statusCode}: ${errorBody}`);
    error.statusCode = statusCode;
    throw error;
  }
  
  return body.json();
}

/**
 * POST JSON data to a URL
 * @param {string} url - The URL to post to
 * @param {object} data - Data to send
 * @param {object} options - Additional request options
 * @returns {Promise<object>} - Parsed JSON response
 */
async function postJSON(url, data, options = {}) {
  const { body, statusCode } = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data),
    dispatcher: agent,
    ...options
  });
  
  if (statusCode >= 400) {
    const errorBody = await body.text();
    const error = new Error(`HTTP ${statusCode}: ${errorBody}`);
    error.statusCode = statusCode;
    throw error;
  }
  
  return body.json();
}

/**
 * Make a Trello API request (uses dedicated pool)
 * @param {string} endpoint - API endpoint (e.g., '/1/boards')
 * @param {object} options - Request options
 * @returns {Promise<object>} - Parsed JSON response
 */
async function trelloRequest(endpoint, options = {}) {
  const { body, statusCode } = await trelloPool.request({
    path: endpoint,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  if (statusCode >= 400) {
    const errorBody = await body.text();
    const error = new Error(`Trello API Error ${statusCode}: ${errorBody}`);
    error.statusCode = statusCode;
    throw error;
  }
  
  return body.json();
}

/**
 * Download a file/buffer from URL
 * @param {string} url - The URL to download from
 * @returns {Promise<Buffer>} - File buffer
 */
async function downloadBuffer(url) {
  const { body, statusCode } = await request(url, {
    dispatcher: agent
  });
  
  if (statusCode >= 400) {
    throw new Error(`Download failed: HTTP ${statusCode}`);
  }
  
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Cleanup function for graceful shutdown
async function closeConnections() {
  await agent.close();
  await trelloPool.close();
}

module.exports = {
  fetchJSON,
  postJSON,
  trelloRequest,
  downloadBuffer,
  closeConnections,
  agent,
  trelloPool
};
