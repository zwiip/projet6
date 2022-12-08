/**
 * @todo ajouter signalement d'erreur si uniqueValidator false ?
 */

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

/**
 * permet de garantir l'unicité des adresses électroniques dans la base de données
 */
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);