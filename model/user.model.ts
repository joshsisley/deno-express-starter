// deno-lint-ignore-file no-explicit-any
import mongoose from "npm:mongoose@^6.7";
import { omitBy, isNil } from 'npm:lodash@^4.17.21';
import bcrypt from "npm:bcrypt@^5.0.1";
import moment from "npm:moment-timezone@^0.5.33";
import jwt from "npm:jwt-simple";
import uuidv4 from "npm:uuid/v4";
import config from '../config/config.ts';

interface TransformedObject {
  [key: string]: string;
}

export interface IOauthData {
  service: string;
  id: string;
  name: string;
  email: string;
}

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  services: {
    facebook: string;
    google: string;
  };
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  token: () => string;
  gravatar: (size: number) => string;
}

interface IUserModel extends mongoose.Model<IUser> {
  oAuthLogin: (service: string, id: string, email: string, name: string) => Promise<IUser>;
}

/**
* User Roles
*/
const roles = ['user', 'admin'];

/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  name: {
    type: String,
    maxlength: 128,
    index: true,
    trim: true,
  },
  services: {
    facebook: String,
    google: String,
  },
  role: {
    type: String,
    enum: roles,
    default: 'user',
  },
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = config.env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
userSchema.method({
  transform: function() {
    const transformed:TransformedObject = {};
    const fields: string[] = ['id', 'name', 'email', 'picture', 'role', 'createdAt'];

    fields.forEach((field:string) => {
      transformed[field] = (this as any)[field];
    });

    return transformed;
  },

  token: function() {
    const payload = {
      exp: moment().add(config.jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: (this as any)._id,
    };
    return jwt.encode(payload, config.jwtSecret);
  },

  // deno-lint-ignore require-await
  async passwordMatches(password:string) {
    return bcrypt.compare(password, password);
  },
});

/**
 * Statics
 */
userSchema.statics = {

  roles: (this as any).roles,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    let user;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await this.findById(id).exec();
    }
    if (user) {
      return user;
    }

    throw new Error('Failed to find user')
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) throw new Error('An email is required to generate a token');

    const user = await this.findOne({ email }).exec();
    const err:Error = {
      name: 'APIError',
      message: 'Incorrect email or password'
    };
    if (password) {
      if (user && await user.passwordMatches(password)) {
        return { user, accessToken: user.token() };
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { user, accessToken: user.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new Error(err.message);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1, perPage = 30, name, email, role,
  }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new Error();
    }
    return error;
  },

  async oAuthLogin({
    service, id, email, name,
  }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name,
    });
  },
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

/**
 * @typedef User
 */
export { User };