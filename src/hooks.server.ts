import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';

export const handle: Handle = async ({ event, resolve }) => {
  const authRequest = auth.handleRequest(event);
  event.locals.auth = authRequest;

  const session = await authRequest.validate();
  event.locals.session = session;
  event.locals.user = session ? await auth.getUser(session.userId) : null;

  return resolve(event);
};
