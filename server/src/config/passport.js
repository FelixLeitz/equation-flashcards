import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { env } from './env.js';
import { User } from '../models/User.js';

/**
 * Extract the JWT from the HttpOnly auth cookie named `token`.
 * (We do not use the Authorization header)
 */
function cookieExtractor(req) {
  if (req && req.cookies && typeof req.cookies.token === 'string') {
    return req.cookies.token;
  }
  return null;
}

/**
 * Local strategy: authenticate by email + password.
 * Uses `usernameField: 'email'` since our identifier is the email address.
 * Returns a generic failure (no user) without revealing which field was wrong.
 */
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select(
          '+passwordHash'
        );
        if (!user) {
          return done(null, false);
        }
        const matches = await user.comparePassword(password);
        if (!matches) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * JWT strategy: verify the signed token from the auth cookie and load the user.
 */
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: env.JWT_SECRET,
      ignoreExpiration: false // reject expired tokens
    },
    async (payload, done) => {
      try {
        // `payload.sub` holds the user id (set when we sign the token).
        const user = await User.findById(payload.sub);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
