/**
 * @todo remplacer token par une chaine aléatoire
 */

const brcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const User = require('../models/user');

/**
 * permet de de hacher le mot de passe de l'utilisateur
 * puis ajout de l'utilisateur à la base de données
 * @param { email: string, password: string } req 
 * @param { message: string } res 
 */
exports.signup = (req, res, next) => {
    brcrypt.hash(req.body.password, 10)
        .then((hash) => {
            const user = new User({
                email: req.body.email,
                password: hash
            });
            user
                .save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }))
        })
        .catch(error => res.status(500).json({ error }))
};

/**
 * Vérification des informations d'identification de l'utilisateur,
 * renvoie l _id de l'utilisateur depuis la base de données
 * et un token web JSON signé (contenant également l'_id de l'utilisateur)
 * messages d'erreurs flous pour ne pas divulguer d'informations
 * @param { email: string, password: string } req 
 * @param { userId: string, token: string } res
 */
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user === null) {
                res.status(401).json({ message: 'Paire identifiant / mot de passe incorrecte' })
            } else {
                brcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({ message: 'Paire identifiant / mot de passe incorrecte' })
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user_id },
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h' }
                                )
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({ error });
                    })
                }
        })
        .catch(error => {
            res.status(500).json({ error });
        })
};