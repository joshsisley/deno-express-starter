// deno-lint-ignore-file no-explicit-any
import mongoose from "npm:mongoose@6.7.5";
import * as uuid from "npm:uuid";
import moment from "npm:moment-timezone@^0.5.33";

interface IPasswordResetToken extends mongoose.Document {
  token: string;
  userId: string;
  userEmail: string;
  expires: Date;
}

interface IPasswordResetTokenModel extends mongoose.Model<IPasswordResetToken> {
  generate: (user: any) => IPasswordResetToken;
}

/**
 * Refresh Token Schema
 * @private
 */
const passwordResetTokenSchema = new mongoose.Schema({
  resetToken: {
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

passwordResetTokenSchema.statics = {
  /**
   * Generate a reset token object and saves it into the database
   *
   * @param {User} user
   * @returns {ResetToken}
   */
  async generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const resetToken = `${userId}.${uuid.v4()}`;
    const expires = moment()
      .add(2, 'hours')
      .toDate();
    const ResetTokenObject = new PasswordResetToken({
      resetToken,
      userId,
      userEmail,
      expires,
    });
    await ResetTokenObject.save();
    return ResetTokenObject;
  },
};

/**
 * @typedef RefreshToken
 */
export const PasswordResetToken = mongoose.model<IPasswordResetToken, IPasswordResetTokenModel>('PasswordResetToken', passwordResetTokenSchema);