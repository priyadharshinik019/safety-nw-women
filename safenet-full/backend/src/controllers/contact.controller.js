const Contact = require('../models/contact.model');

// ── GET /api/contacts ────────────────────────────────────────────
const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id }).sort('priority');
    res.json({ contacts });
  } catch (err) { next(err); }
};

// ── POST /api/contacts ───────────────────────────────────────────
const addContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, priority, notifyBySMS, notifyByCall, notifyByPush } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });

    const contact = await Contact.create({
      owner: req.user._id,
      name, phone, email, relationship,
      priority: priority || 1,
      notifyBySMS: notifyBySMS ?? true,
      notifyByCall: notifyByCall ?? true,
      notifyByPush: notifyByPush ?? false,
    });
    res.status(201).json({ message: 'Contact added.', contact });
  } catch (err) { next(err); }
};

// ── PATCH /api/contacts/:id ──────────────────────────────────────
const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ message: 'Contact updated.', contact });
  } catch (err) { next(err); }
};

// ── DELETE /api/contacts/:id ─────────────────────────────────────
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ message: 'Contact removed.' });
  } catch (err) { next(err); }
};

// ── PATCH /api/contacts/reorder ──────────────────────────────────
const reorderContacts = async (req, res, next) => {
  try {
    // Expects: [{ id, priority }, ...]
    const { order } = req.body;
    await Promise.all(
      order.map(({ id, priority }) =>
        Contact.findOneAndUpdate({ _id: id, owner: req.user._id }, { priority })
      )
    );
    res.json({ message: 'Contacts reordered.' });
  } catch (err) { next(err); }
};

module.exports = { getContacts, addContact, updateContact, deleteContact, reorderContacts };
