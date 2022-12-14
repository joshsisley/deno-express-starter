// deno-lint-ignore-file no-explicit-any
import passport from "npm:passport";
import { IUser, User } from "../model/user.model.ts";
import Promise from "npm:bluebird";

export enum AUTH {
  ADMIN = 'admin',
  LOGGED_USER = '_loggedUser',
}

const handleJWT = (req: any, _res: any, next: any, roles: any) => async (err: Error, user: IUser, info: string) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new Error(error ? error.message : 'Unauthorized');

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (_e) {
    return next(apiError);
  }

  if (roles === AUTH.LOGGED_USER) {
    if (user.role !== 'admin' && req.params.userId !== user._id.toString()) {
      apiError.message = 'Forbidden';
      return next(apiError);
    }
  } else if (!roles.includes(user.role)) {
    apiError.message = 'Forbidden';
    return next(apiError);
  } else if (err || !user) {
    return next(apiError);
  }

  req.user = user;

  return next();
};

export const authorize = (roles = User.roles) => (req: any, res: any, next: any) => passport.authenticate(
  'jwt', { session: false },
  handleJWT(req, res, next, roles),
)(req, res, next);

export const oAuth = (service: any) => passport.authenticate(service, { session: false });