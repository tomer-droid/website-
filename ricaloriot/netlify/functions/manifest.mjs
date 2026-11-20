// /api/manifest - the web-app manifest (see server/manifest.js)
import handler from '../../server/manifest.js';

export default (request) => handler.fetch(request);

export const config = { path: '/api/manifest' };
