// deno-lint-ignore-file no-explicit-any
import BearerStrategy from 'npm:passport-http-bearer';
import { ExtractJwt, Strategy } from 'npm:passport-jwt';
import config from './config.ts';
import authProviders from '../services/auth-providers.ts';
import { IOauthData, User } from '../model/user.model.ts';

const jwtOptions = {
  secretOrKey: config.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

const JwtStrategy = Strategy;

const jwt = async (payload: any, done: any) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

const oAuth = (service: 'facebook' | 'google') => async (token:any, done:any) => {
  try {
    const userData: IOauthData = await authProviders[service](token);
    // const user = await User.schema.statics.oAuthLogin(userData);
    const user = await User.oAuthLogin(userData.service, userData.id, userData.email, userData.name);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwt);
const facebook = new BearerStrategy(oAuth('facebook'));
const google = new BearerStrategy(oAuth('google'));

export default {
  jwtStrategy,
  facebook,
  google,
};