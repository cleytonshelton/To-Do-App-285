import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Note the .js extension—required in ESM!

export const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'super secret code shhh', async (err, decodedToken) => {
            if (err) {
                return res.redirect('/login');
            }
            const user = await User.findById(decodedToken.id);
            if (!user) return res.redirect('/login');
            
            req.user = user;
            next();
        });
    } else {
        res.redirect('/login');
    }
};

export const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'super secret code shhh', async (err, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};