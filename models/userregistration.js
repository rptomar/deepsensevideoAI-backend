import mongoose from 'mongoose';

const RegisterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    confirmPassword: { type: String },
});

export default mongoose.model('user', RegisterSchema);