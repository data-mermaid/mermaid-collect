Mermaid-Collect
===============

Master Branch [![Mermaid-Collect](https://circleci.com/gh/WildlifeConservationSocietyCI/mermaid-collect/tree/master.svg?style=svg&circle-token=8c7c6546e3f505236cd62441beb910047f93d41f)](https://circleci.com/gh/WildlifeConservationSocietyCI/mermaid-collect/tree/master)


Dev Branch [![Mermaid-Collect](https://circleci.com/gh/WildlifeConservationSocietyCI/mermaid-collect/tree/dev.svg?style=svg&circle-token=8c7c6546e3f505236cd62441beb910047f93d41f)](https://circleci.com/gh/WildlifeConservationSocietyCI/mermaid-collect/tree/dev)


Auth0 Settings
--------------

1. Copy or move a file called `src/mermaid-config-template.js` to `src/mermaid-config.js`
2. Populate all constants therein.

Development
-----------
To run the code in your development environment:

1. Clone this repo
2. Ensure you are running the most recent LTS version of [node](https://nodejs.org/en/download/releases/). 
The [nvm](https://github.com/nvm-sh/nvm) version manager is recommended.
3. Run `npm install`
4. Run `npm install -g bower`
5. Run `bower install`

Now with all dependencies installed

4. Start the development server `gulp local`
5. Point your browser to [http://localhost:8888](http://localhost:8888)


Production
----------
To build minified version:

- Run `npm run prod`


Offline Service Worker Notes
----------------------------

In Chrome, a hard refresh bypasses service workers as per the service worker spec. As such, if you hard refresh a page when offline, the page request will ignore service workers and make a network request.

Additionally, if the application is online, and a hard refresh occurs in any state of the app, the current page will bypass the service worker and will no longer be controlled by the service worker. If going offline immediately after an online hard refresh, the service worker will not control requests and network errors will occur when navigating.

Chrome Dev Tools allow for offline simulation. However, if visiting an offline page by checking "offline" in Chrome Dev Tools, there is an initial period where navigator.onLine will still return true. For true offline testing, it is best to test by disconnecting from your internet connection.


