import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Token expires in 3 days
const maxAge = 3 * 24 * 60 * 60; 

/**
 * Creates a JWT Token
 * @param {string} id - The MongoDB User ID
 */
const createToken = (id) => {
    // Secret should ideally be in a .env file
    return jwt.sign({ id }, 'super secret code shhh', {
        expiresIn: maxAge
    });
};

/**
 * Handle Signup Logic
 */
export const signup_post = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.create({ username, password });
        const token = createToken(user._id);
        
        // Set cookie: httpOnly prevents client-side JS from reading it (XSS protection)
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (err) {
        let errors = { username: '', password: '' };
        console.log("Signup Error Object:", err);

        // Duplicate username error
        if (err.code === 11000) {
            errors.username = 'That username is already taken';
        }

        // Validation errors
        if (err.message.includes('user validation failed')) {
            Object.values(err.errors).forEach(({ properties }) => {
                errors[properties.path] = properties.message;
            });
        }

        res.status(400).json({ errors });
    }
};

/**
 * Handle Login Logic
 */
export const login_post = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Uses the static 'login' method we added to the User Schema
        const user = await User.login(username, password);
        const token = createToken(user._id);

        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        let errors = { username: '', password: '' };
        
        if (err.message === 'Incorrect Username') errors.username = 'That username is not registered';
        if (err.message === 'Incorrect Password') errors.password = 'That password is incorrect';
        
        res.status(400).json({ errors });
    }
};

/**
 * Handle Logout Logic
 */
export const logout_get = (req, res) => {
    // Overwrite the cookie with an empty string and 1ms expiration
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};

// Default export if you prefer importing the whole object
export default {
    signup_post,
    login_post,
    logout_get
};