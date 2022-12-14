// deno-lint-ignore-file no-explicit-any
import { IUser } from "../model/user.model.ts";

import moment from 'npm:moment-timezone';
import * as _ from 'npm:lodash';
import { User } from '../model/user.model.ts';
import { RefreshToken } from '../model/refresh-token.model.ts';
import { PasswordResetToken } from '../model/password-reset-token.model.ts';
import config from '../config/config.ts';
// TODO: Add in the email provider


/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(user: IUser, accessToken: any) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(config.jwtExpirationInterval, 'minutes');
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
export const register = async (req: any, res: any, next: any) => {
  try {
    const userData = _.omit(req.body, 'role');
    const user = await new User(userData).save();
    const userTransformed = user.transform();
    const token = generateTokenResponse(user, user.token());
    res.status(201);
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
export const login = async (req: any, res: any, next: any) => {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
export const oAuth = (req: any, res: any, next: any) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
export const refresh = async (req: any, res: any, next: any) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

export const sendPasswordReset = async (req: any, res: any, next: any) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).exec();

    if (user) {
      const passwordResetObj = await PasswordResetToken.generate(user);
      // TODO: Password reset email
      // emailProvider.sendPasswordReset(passwordResetObj);
      res.status(200);
      return res.json('success');
    }
    throw new Error('No account found with that email');
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req: any, res: any, next: any) => {
  try {
    const { email, password, resetToken } = req.body;
    const resetTokenObject = await PasswordResetToken.findOneAndRemove({
      userEmail: email,
      resetToken,
    });

    if (!resetTokenObject) {
      throw new Error('Cannot find matching reset token');
    }
    if (moment().isAfter(resetTokenObject.expires)) {
      throw new Error('Reset token is expired');
    }

    const user = await User.findOne({ email: resetTokenObject.userEmail }).exec();
    if (user) {
      user.password = password;
      await user.save();
    }
    // TODO: send email to user that password has been changed
    // emailProvider.sendPasswordChangeEmail(user);

    res.status(200);
    return res.json('Password Updated');
  } catch (error) {
    return next(error);
  }
};