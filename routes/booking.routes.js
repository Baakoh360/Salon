const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Get all bookings
router.get('/', async(req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
});

// Get a single booking
router.get('/:id', async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Failed to fetch booking' });
    }
});

// Create a new booking
router.post('/', async(req, res) => {
    try {
        const {
            clientName,
            clientPhone,
            clientEmail,
            serviceId,
            serviceName,
            stylistId,
            stylistName,
            date,
            time,
            notes,
            status
        } = req.body;

        const newBooking = new Booking({
            clientName,
            clientPhone,
            clientEmail,
            serviceId,
            serviceName,
            stylistId,
            stylistName,
            date,
            time,
            notes,
            status: status || 'scheduled',
            createdAt: new Date()
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Failed to create booking' });
    }
});

// Update a booking
router.put('/:id', async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const updateData = {
            clientName: req.body.clientName,
            clientPhone: req.body.clientPhone,
            clientEmail: req.body.clientEmail,
            serviceId: req.body.serviceId,
            serviceName: req.body.serviceName,
            stylistId: req.body.stylistId,
            stylistName: req.body.stylistName,
            date: req.body.date,
            time: req.body.time,
            notes: req.body.notes,
            status: req.body.status,
            updatedAt: new Date()
        };

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true }
        );

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Failed to update booking' });
    }
});

// Delete a booking
router.delete('/:id', async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Failed to delete booking' });
    }
});

module.exports = router;