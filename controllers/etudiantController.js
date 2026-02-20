// Importer le modèle Etudiant
const Etudiant = require('../models/Etudiant');

// Les fonctions CRUD seront ajoutées ici...

// CREATE - Créer un nouvel étudiant
// ============================================
// Route:  POST /api/etudiants
// Cette fonction reçoit les données d'un étudiant dans le body
// de la requête et les enregistre dans la base de données. 

exports.createEtudiant = async (req, res) => {
    try {
        // Étape 1: Récupérer les données envoyées par le client
        // req.body contient les données JSON envoyées
        console.log('📥 Données reçues:', req.body);
        // Étape 2: Empêcher la création si un étudiant avec le même
        // nom ET prénom existe déjà
        const { nom, prenom } = req.body;
        if (nom && prenom) {
            const deja = await Etudiant.findOne({ nom: nom, prenom: prenom });
            if (deja) {
                return res.status(400).json({
                    success: false,
                    message: 'Un étudiant avec ce nom et ce prénom existe déjà'
                });
            }
        }

        // Étape 3: Créer l'étudiant dans la base de données
        // Mongoose valide automatiquement les données selon le schéma
        const etudiant = await Etudiant.create(req.body);
        
        // Étape 3: Renvoyer une réponse de succès (code 201 = Created)
        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès',
            data: etudiant
        });
        
    } catch (error) {
        // Gestion des erreurs
        
        // Erreur de doublon (email déjà existant)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Cet email existe déjà'
            });
        }
        
        // Autres erreurs (validation, etc.)
        res.status(400).json({
            success: false,
            message: 'Données invalides',
            error: error.message
        });
    }
};
// ============================================
// READ ALL - Récupérer tous les étudiants
// ============================================
// Route: GET /api/etudiants
// Cette fonction retourne la liste complète des étudiants.

exports.getAllEtudiants = async (req, res) => {
    try {
        // Étape 1: Récupérer tous les documents actifs de la collection
        // Seuls les étudiants avec `actif: true` sont retournés
        const etudiants = await Etudiant.find({ actif: true });
        
        // Étape 2: Renvoyer la liste avec le nombre total
        res.status(200).json({
            success: true,
            count: etudiants.length,  // Nombre d'étudiants trouvés
            data: etudiants
        });
        
    } catch (error) {
        // Erreur serveur (code 500)
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
// ============================================
// READ ONE - Récupérer un étudiant par son ID
// ============================================
// Route: GET /api/etudiants/:id
// Le : id dans l'URL est un paramètre dynamique. 
// Exemple:  GET /api/etudiants/507f1f77bcf86cd799439011

exports.getEtudiantById = async (req, res) => {
    try {
        // Étape 1: Récupérer l'ID depuis les paramètres de l'URL
        // req.params contient les paramètres de l'URL
        console.log('🔍 Recherche de l\'ID:', req.params.id);
        
        // Étape 2: Chercher l'étudiant par son ID
        const etudiant = await Etudiant.findById(req.params.id);
        
        // Étape 3: Vérifier si l'étudiant existe
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        // Étape 4: Renvoyer l'étudiant trouvé
        res.status(200).json({
            success: true,
            data: etudiant
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
// ============================================
// UPDATE - Mettre à jour un étudiant
// ============================================
// Route: PUT /api/etudiants/:id
// Cette fonction modifie les champs d'un étudiant existant.

exports.updateEtudiant = async (req, res) => {
    try {
        console.log('✏️ Mise à jour de l\'ID:', req.params.id);
        console.log('📥 Nouvelles données:', req.body);
        
        // findByIdAndUpdate prend 3 arguments: 
        // 1. L'ID du document à modifier
        // 2. Les nouvelles données
        // 3. Options:  
        //    - new: true = retourne le document modifié (pas l'ancien)
        //    - runValidators: true = applique les validations du schéma
        
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params. id,
            req.body,
            { new: true, runValidators: true }
        );
        
        // Vérifier si l'étudiant existe
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Étudiant mis à jour avec succès',
            data: etudiant
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur de mise à jour',
            error: error.message
        });
    }
};
// ============================================
// DELETE - Supprimer un étudiant
// ============================================
// Route: DELETE /api/etudiants/:id
// Cette fonction supprime définitivement un étudiant. 

exports.deleteEtudiant = async (req, res) => {
    try {
        console.log('🗑️ Suppression de l\'ID:', req.params.id);
        
        // Suppression douce: on met `actif: false` au lieu de supprimer
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            { actif: false },
            { new: true }
        );

        // Vérifier si l'étudiant existait
        if (!etudiant) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Étudiant désactivé avec succès',
            data: etudiant
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error. message
        });
    }
};
// ============================================
// SEARCH - Rechercher des étudiants par filière
// ============================================
// Route:  GET /api/etudiants/filiere/:filiere
// Exemple: GET /api/etudiants/filiere/Informatique

exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        console.log('🔎 Recherche par filière:', req.params.filiere);
        
        // Chercher tous les étudiants avec cette filière
        const etudiants = await Etudiant. find({ filiere: req.params.filiere });
        
      res.status(200).json({
            success: true,
            count: etudiants.length,
            filiere: req.params.filiere,
            data: etudiants
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error. message
        });
    }
}

// ============================================
// READ DISABLED - Récupérer les étudiants désactivés
// ============================================
// Route: GET /api/etudiants/desactives
exports.getEtudiantsDesactives = async (req, res) => {
    try {
        // Récupérer les étudiants avec actif: false
        const etudiants = await Etudiant.find({ actif: false });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
}

// ============================================
// SEARCH - Rechercher des étudiants par nom ou prénom
// ============================================
// Route: GET /api/etudiants/search?q=ahmed
// Recherche insensible à la casse dans le `nom` OU le `prenom`.
exports.searchEtudiants = async (req, res) => {
    try {
        const q = req.query.q;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Paramètre de recherche manquant. Utilisez ?q=mot'
            });
        }

        const regex = new RegExp(q, 'i'); // insensible à la casse

        const etudiants = await Etudiant.find({
            $or: [
                { nom: regex },
                { prenom: regex }
            ]
        });

        res.status(200).json({
            success: true,
            count: etudiants.length,
            query: q,
            data: etudiants
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
}

