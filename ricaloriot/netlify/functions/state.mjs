// /api/state - the shared state (see server/state.js)
import handler from '../../server/state.js';

export default (request, context) => handler.fetch(request, context);

export const config = { path: '/api/state' };
