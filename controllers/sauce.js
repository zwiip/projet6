const Sauce = require('../models/sauce');
const fs = require('fs');

/**
 * Renvoie un tableau de toutes les sauces de la base de données.
 * @param {*} req 
 * @param {[Array]} res
 */
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }))
}

/**
 * Renvoie la sauce avec l'_id fourni
 * @param {*} req 
 * @param {object} res  
 */
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

/**
 * Capture et enregistre l'image,
 * analyse la sauce transformée en chaîne de caractères et l'enregistre dans la base de données en définissant correctement son imageUrl.
 * Initialise les likes et dislikes de la sauce à 0 et les usersLiked et usersDisliked avec des tableaux vides.
 * @param { sauce: String, image: File } req 
 * @param { message: String } res 
 */
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [''],
        usersDisliked: [''],
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: 'Sauce enregistrée !' }) })
        .catch(error => { res.status(400).json({ error }) });
};

/**
 * Met à jour la sauce avec l'_id fourni.
 * Si une image est téléchargée, elle est capturée et l’imageUrl de la sauce est mise à jour.
 * Si aucun fichier n'est fourni, les informations sur la sauce se trouvent directement dans le corps de la requête.
 * Si un fichier est fourni, la sauce transformée en chaîne de caractères se trouve dans req.body.sauce.
 * Une condition permet de s'assurer que seul le propriétaire de la sauce peut apporter des modifs à celle-ci 
 * @param {EITHER Sauce.JSON OR { sauce: String, image: File }} req 
 * @param { message: String } res 
 * @param {*} next 
 */
exports.modifySauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message: 'unauthorized request' })
            } else {
                console.log('user ok')
                if (req.file) {
                    console.log('il y a une image')
                    const filename = sauce.imageUrl.split("/images/")[1];
                    fs.unlink(`images/${filename}`, () => {
                        console.log("suppression de l'ancienne image et ajout de la nouvelle")
                        const sauceObjectWithImg = {
                            ...JSON.parse(req.body.sauce),
                            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                        }
                        Sauce.updateOne({ _id: req.params.id }, { ...sauceObjectWithImg, _id: req.params.id })
                            .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                            .catch(error => res.status(401).json({ error }))
                    })
                } else {
                    console.log("il n'y a pas d'image")
                    const sauceObject = { ...req.body }
                    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                        .catch(error => res.status(401).json({ error }))
                }
            }
        })
        .catch((error) => {
            res.status(400).json({ error })
        })
};

/**
 * Supprime la sauce avec l'_id fourni et retire l'image du dossier images
 * @param {-} req 
 * @param { message: String } res 
 */
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message: 'unauthorized request' })
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Sauce supprimée !' }) })
                        .catch(error => res.status(401).json({ error }))
                })
            }
        })
        .catch(error => {
            res.status(500).json({ error })
        })
}

/**
 * Définit le statut « Like » pour l' userId fourni.
 *  Si like = 1, l'utilisateur aime (= like) la sauce.
 *  Si l'utilisateur annule son like ou son dislike, met le like sur 0
 *  Si like = -1, l'utilisateur n'aime pas (= dislike) la sauce.
 * L'ID de l'utilisateur est ajouté ou retiré du tableau approprié afin de garder une trace de leurs préférences
 * Permet également de les empêche de liker ou de ne pas disliker la même sauce plusieurs fois : un utilisateur ne peut avoir qu'une seule valeur pour chaque sauce.
 * Le nombre total de « Like » et de « Dislike » est mis à jour à chaque nouvelle notation.
 * @param { userId: String, like: Number } req 
 * @param { message: String } res 
 */
exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const likerID = req.body.userId
            res.status(200).json(sauce);

            if (req.body.like === 1) {
                console.log(req.body.like, " : c'est un like")
                console.log("ID du liker, pas encore liké : ", likerID)
                sauce.usersLiked.push(likerID)
                sauce.likes++
                sauce.save()
                console.log('ajout du like, tableau des likers : ', sauce.usersLiked, 'total de likes : ', sauce.likes)
            }

            if (req.body.like === 0) {
                console.log(req.body.like, " : c'est une annulation")
                if (sauce.usersLiked.includes(likerID)) {
                    console.log("ID ", likerID, ' a déjà liké')
                    let index = sauce.usersLiked.findIndex(id => id === likerID)
                    sauce.usersLiked.splice(index, 1)
                    sauce.likes--
                    sauce.save()
                    console.log('Annulation du like, tableau des likers restants : ', sauce.usersLiked, 'total de likes', sauce.likes)
                } else if (sauce.usersDisliked.includes(likerID)) {
                    console.log("ID ", likerID, ' a déjà disliké')
                    let index = sauce.usersDisliked.findIndex(id => id === likerID)
                    sauce.usersDisliked.splice(index, 1)
                    sauce.dislikes--
                    console.log('Annulation du dislike, tableau des dislikers restants : ', sauce.usersDisliked, 'total de dislikes : ', sauce.dislikes)
                    sauce.save()
                }
            }

            if (req.body.like === -1) {
                console.log(req.body.like, " : c'est un dislike")
                console.log("ID ", likerID, " pas encore disliké")
                sauce.usersDisliked.push(likerID)
                sauce.dislikes++
                console.log('ajout du dislike, tableau des dislikers : ', sauce.usersDisliked, 'total de dislikes : ', sauce.dislikes)
                sauce.save()
            }
        })
        .catch((error) => res.status(404).json({error: "erreur avec le findOne", error }));
}
