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
 * @param {EITHER Sauce.JSON OR { sauce: String, image: File }} req 
 * @param { message: String } res 
 * @param {*} next 
 */
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            // permet de s'assurer que seul le propriétaire de la sauce peut apportder des modifs à celle-ci
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message: 'unauthorized request' })
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
                    .catch(error => res.status(401).json({ error }))
            }
        })
        .catch((error) => {
            res.status(400).json({ error })
        })
};

/**
 * Supprime la sauce avec l'_id fourni
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

    Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
        .catch(error => res.status(404).json({ error }))
}

/**
 * Définit le statut « Like » pour l' userId fourni.
 *  Si like = 1, l'utilisateur aime (= like) la sauce.
 *  Si like = 0, l'utilisateur annule son like ou son dislike.
 *  Si like = -1, l'utilisateur n'aime pas (= dislike) la sauce.
 * L'ID de l'utilisateur est ajouté ou retiré du tableau approprié afin de garder une trace de leurs préférences
 * Permet également de les empêche de liker ou de ne pas disliker la même sauce plusieurs fois : un utilisateur ne peut avoir qu'une seule valeur pour chaque sauce.
 * Le nombre total de « Like » et de « Dislike » est mis à jour à chaque nouvelle notation.
 * @param { userId: String, like: Number } req 
 * @param { message: String } res 
 */
/*exports.likeSauce = (req, res, next) => {
    if (req.body.like === 1) {
        Sauce.usersLiked.find()
         }}*/
/* NOTES DE TRAVAIL
if (req.body.like === 1) {
    est-ce que la personne a déjà liké
        oui { alert elle ne peut pas reliker
            return }
        non { est-ce que la personne a disliké}
            oui { suppression du dislike id
                 quantité likes = usersLiked.length
                quantité dislikes = usersDisliked.length}
            ajout du like quantité
            ajout du l'id dans array
}

if (req.body.like === -1) {
    est-ce que déjà dislike ? {
        oui {elle ne peut pas re disliker
            return}
        non { est-ce que la personne est dans les likes}
            oui { suppression du dislike
                }
    }
}

if (req.body.like === 0) {
    Est-ce qu'il y a un like ?
        oui { suppression du like }
        non { est-ce qu'il y a un dislike ? }
            oui { suppression du dislike }
            non { alert la sauce est déjà à 0}
}


.push('_id')
total = total d'id donc .length
    }
}*/



