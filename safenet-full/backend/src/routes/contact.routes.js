const router = require('express').Router();
const {
  getContacts, addContact, updateContact, deleteContact, reorderContacts,
} = require('../controllers/contact.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/',           getContacts);
router.post('/',          addContact);
router.patch('/reorder',  reorderContacts);
router.patch('/:id',      updateContact);
router.delete('/:id',     deleteContact);

module.exports = router;
