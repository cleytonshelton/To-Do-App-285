import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username'], // Corrected typo
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'], // Corrected typo
        minlength: [6, 'Minimum password length is 6 characters']
    },
    points: {
        type: Number,
        default: 0,
    },
    rewardsHistory: [
      {
        item: { type: String, required: true },
        cost: { type: Number, required: true },
        redeemedAt: { type: Date, default: Date.now }
      }
    ]
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return; 

    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);

});

// Static method to login user
userSchema.statics.login = async function(username, password) {
    const user = await this.findOne({ username });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error('Incorrect Password');
    }
    throw Error('Incorrect Username');
};

const User = mongoose.model('user', userSchema);

export default User;