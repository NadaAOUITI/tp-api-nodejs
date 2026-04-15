const mongoose = require('mongoose');
const Etudiant = require('../models/Etudiant');

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// CREATE
exports.createEtudiant = async (req, res) => {
    try {
        const { nom, prenom, moyenne } = req.body;

        if (!nom || !prenom) {
            return res.status(400).json({ message: 'Le nom et le prénom sont obligatoires' });
        }
        if (moyenne !== undefined && typeof moyenne !== 'number') {
            return res.status(400).json({ message: 'La moyenne doit être un nombre' });
        }
        if (moyenne !== undefined && (moyenne < 0 || moyenne > 20)) {
            return res.status(400).json({ message: 'La moyenne doit être comprise entre 0 et 20' });
        }

        // Empêcher doublon nom + prénom
        const deja = await Etudiant.findOne({ nom, prenom });
        if (deja) {
            return res.status(400).json({ message: 'Un étudiant avec ce nom et ce prénom existe déjà' });
        }

        const etudiant = new Etudiant(req.body);
        await etudiant.save();
        res.status(201).json(etudiant);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Cet email existe déjà' });
        }
        res.status(400).json({ message: error.message });
    }
};

// READ ALL
exports.getAllEtudiants = async (req, res) => {
    try {
        const etudiants = await Etudiant.find({ actif: true });
        res.status(200).json(etudiants);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// READ ONE
exports.getEtudiantById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID invalide' });
        }
        const etudiant = await Etudiant.findById(req.params.id);
        if (!etudiant) {
            return res.status(404).json({ message: 'Étudiant non trouvé' });
        }
        res.status(200).json(etudiant);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// UPDATE
exports.updateEtudiant = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID invalide' });
        }
        const etudiant = await Etudiant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!etudiant) {
            return res.status(404).json({ message: 'Étudiant non trouvé' });
        }
        res.status(200).json(etudiant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE (soft)
exports.deleteEtudiant = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID invalide' });
        }
        const etudiant = await Etudiant.findByIdAndDelete(req.params.id);
        if (!etudiant) {
            return res.status(404).json({ message: 'Étudiant non trouvé' });
        }
        res.status(200).json({ message: 'Étudiant supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// BY FILIERE
exports.getEtudiantsByFiliere = async (req, res) => {
    try {
        const etudiants = await Etudiant.find({ filiere: req.params.filiere });
        res.status(200).json({ success: true, count: etudiants.length, filiere: req.params.filiere, data: etudiants });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// DESACTIVES
exports.getEtudiantsDesactives = async (req, res) => {
    try {
        const etudiants = await Etudiant.find({ actif: false });
        res.status(200).json({ success: true, count: etudiants.length, data: etudiants });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// SEARCH (?nom= pour filtrer sur le nom, ?q= pour nom ou prénom — insensible à la casse)
exports.searchEtudiants = async (req, res) => {
    try {
        const nomParam = req.query.nom;
        const q = req.query.q;

        if (nomParam !== undefined && String(nomParam).trim().length > 0) {
            const nom = String(nomParam).trim();
            const regex = new RegExp(escapeRegex(nom), 'i');
            const etudiants = await Etudiant.find({ nom: regex });
            return res.status(200).json({
                success: true,
                count: etudiants.length,
                query: { nom },
                data: etudiants
            });
        }

        if (!q || String(q).trim().length === 0) {
            return res.status(400).json({
                message: 'Paramètre de recherche manquant. Utilisez ?q=mot ou ?nom=nom'
            });
        }
        const regex = new RegExp(escapeRegex(String(q).trim()), 'i');
        const etudiants = await Etudiant.find({ $or: [{ nom: regex }, { prenom: regex }] });
        res.status(200).json({ success: true, count: etudiants.length, query: q, data: etudiants });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// STATISTIQUES (étudiants actifs uniquement)
exports.getEtudiantsStats = async (req, res) => {
    try {
        const result = await Etudiant.aggregate([
            { $match: { actif: true } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    moyenne_generale: { $avg: '$moyenne' },
                    min: { $min: '$moyenne' },
                    max: { $max: '$moyenne' }
                }
            }
        ]);
        if (!result.length || result[0].count === 0) {
            return res.status(200).json({
                count: 0,
                moyenne_generale: null,
                min: null,
                max: null
            });
        }
        const s = result[0];
        res.status(200).json({
            count: s.count,
            moyenne_generale: s.moyenne_generale,
            min: s.min,
            max: s.max
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ADVANCED SEARCH
exports.advancedSearch = async (req, res) => {
    try {
        const { nom, filiere, anneeMin, anneeMax, moyenneMin } = req.query;
        let filter = { actif: true };
        if (nom) filter.nom = new RegExp(nom, 'i');
        if (filiere) filter.filiere = filiere;
        if (anneeMin || anneeMax) {
            filter.annee = {};
            if (anneeMin) filter.annee.$gte = parseInt(anneeMin);
            if (anneeMax) filter.annee.$lte = parseInt(anneeMax);
        }
        if (moyenneMin) filter.moyenne = { $gte: parseFloat(moyenneMin) };
        const etudiants = await Etudiant.find(filter);
        res.status(200).json({ success: true, count: etudiants.length, filters: req.query, data: etudiants });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// SORTED BY MOYENNE DESC
exports.getEtudiantsSorted = async (req, res) => {
    try {
        const etudiants = await Etudiant.find({ actif: true }).sort({ moyenne: -1 });
        res.status(200).json({ success: true, count: etudiants.length, data: etudiants });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
