// deno-lint-ignore-file no-explicit-any
import mongoose from "npm:mongoose@6.7.5";
import * as uuid from "npm:uuid";
import moment from "npm:moment-timezone@^0.5.33";

interface IRefreshToken extends mongoose.Document {
  token: string;
  userId: string;
  userEmail: string;
  expires: Date;
}

interface IRefreshTokenModel extends mongoose.Model<IRefreshToken> {
  generate: (user: any) => IRefreshToken;
}

/**
 * Refresh Token Schema
 * @private
 */
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: 'String',
    ref: 'User',
    required: true,
  },
  expires: { type: Date },
});

refreshTokenSchema.statics = {

  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {RefreshToken}
   */
  generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const token = `${userId}.${uuid.v4()}`;
    const expires = moment().add(30, 'days').toDate();
    const tokenObject = new RefreshToken({
      token, userId, userEmail, expires,
    });
    tokenObject.save();
    return tokenObject;
  },

};

/**
 * @typedef RefreshToken
 */
export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>('RefreshToken', refreshTokenSchema);