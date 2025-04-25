const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    clientEmail: { type: String },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    stylistId: { type: String, required: true },
    stylistName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    notes: { type: String },
    status: { type: String, default: 'scheduled' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('Booking', bookingSchema);