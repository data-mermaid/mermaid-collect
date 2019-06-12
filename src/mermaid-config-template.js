var MERMAID_CONFIG = {
  // Client-side URL
  HOST_URL: '{HOST_URL}',

  // From Auth0 Application/API entry
  AUTH0_CLIENT_ID: '{AUTH0_CLIENT_ID}',
  AUTH0_DOMAIN: '{AUTH0_DOMAIN}',
  AUTH0_AUDIENCE: '{AUTH0_AUDIENCE}',
  AUTH0_CALLBACK_URL: 'http://localhost:8888/#/callback',

  AUTH0_SILENT_AUTH_REDIRECT: 'http://localhost:8888/silent.html',
  API_ROOT_URL: 'http://localhost:8080/',
  API_URL: 'http://localhost:8080/v1/',

  // URL to endpoint to track javascript logging
  // See: ~/src/app/_mermaid_common/libs/logger.provider.js
  LOGGER_URL: null,
  // Email to use for contact forms
  SYSTEM_EMAIL: '{SYSTEM_EMAIL}',
  // Prefix to attach to IndexedDB database/tables
  LOCAL_DB_NAME: 'mermaid'
};
