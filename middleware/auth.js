/**
 * @todo remplacer token par soite numérique aléatoire dans .env
 */

const jwt = require('jsonwebtoken');

/**
 * permet de vérifier la validité du token
 */
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decodedToken = jwt.verify(token, `${process.env.TOKEN_KEY}`)
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
        next()
    } catch (error) {
        res.status(401).json({ error })
    }
}