const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Etudiant = require('../models/Etudiant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await Etudiant.deleteMany({});
});

// Données valides réutilisables
const etudiantValide = {
  nom: 'Dupont',
  prenom: 'Alice',
  email: 'dupont.alice@ecole.tn',
  filiere: 'Informatique',
  annee: 2,
  moyenne: 15
};

const etudiantValide2 = {
  nom: 'Martin',
  prenom: 'Bob',
  email: 'martin.bob@ecole.tn',
  filiere: 'Informatique',
  annee: 1,
  moyenne: 12
};


describe('GET /api/etudiants', () => {

  test('retourne un tableau vide si aucun étudiant', async () => {
    const res = await request(app).get('/api/etudiants');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('retourne tous les étudiants', async () => {
    await Etudiant.create([etudiantValide, etudiantValide2]);
    const res = await request(app).get('/api/etudiants');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

});


describe('POST /api/etudiants', () => {

  test('crée un étudiant et retourne 201', async () => {
    const res = await request(app).post('/api/etudiants').send(etudiantValide);
    expect(res.statusCode).toBe(201);
    expect(res.body.nom).toBe('Dupont');
    expect(res.body._id).toBeDefined();
  });

  test('retourne 400 si le nom est manquant', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ prenom: 'Alice', email: 'alice@ecole.tn', filiere: 'Informatique', annee: 2, moyenne: 15 });
    expect(res.statusCode).toBe(400);
  });

  test('retourne 400 si la moyenne est négative', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...etudiantValide, moyenne: -5 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  test('retourne 400 si la moyenne dépasse 20', async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...etudiantValide, moyenne: 25 });
    expect(res.statusCode).toBe(400);
  });

  test("retourne 400 si la moyenne n'est pas un nombre", async () => {
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...etudiantValide, moyenne: 'bonne' });
    expect(res.statusCode).toBe(400);
  });

  test('retourne 409 si email déjà utilisé', async () => {
    await Etudiant.create(etudiantValide);
    const res = await request(app)
      .post('/api/etudiants')
      .send({ ...etudiantValide, nom: 'Autre', prenom: 'Personne' });
    expect(res.statusCode).toBe(409);
  });

});


describe('GET /api/etudiants/:id', () => {

  test("retourne l'étudiant correspondant", async () => {
    const etudiant = await Etudiant.create(etudiantValide);
    const res = await request(app).get(`/api/etudiants/${etudiant._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.nom).toBe('Dupont');
  });

  test('retourne 404 pour un ID inexistant', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/etudiants/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test('retourne 400 pour un ID mal formaté', async () => {
    const res = await request(app).get('/api/etudiants/pas-un-id-valide');
    expect(res.statusCode).toBe(400);
  });

});


describe('PUT /api/etudiants/:id', () => {

  test('met à jour un étudiant', async () => {
    const etudiant = await Etudiant.create(etudiantValide);
    const res = await request(app)
      .put(`/api/etudiants/${etudiant._id}`)
      .send({ moyenne: 17 });
    expect(res.statusCode).toBe(200);
    expect(res.body.moyenne).toBe(17);
    expect(res.body.nom).toBe('Dupont');
  });

  test("retourne 404 si l'étudiant n'existe pas", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).put(`/api/etudiants/${fakeId}`).send({ moyenne: 17 });
    expect(res.statusCode).toBe(404);
  });

  test('retourne 400 pour un ID mal formaté', async () => {
    const res = await request(app).put('/api/etudiants/id-invalide').send({ moyenne: 17 });
    expect(res.statusCode).toBe(400);
  });

  test('retourne 400 si la moyenne mise à jour est hors limites', async () => {
    const etudiant = await Etudiant.create(etudiantValide);
    const res = await request(app)
      .put(`/api/etudiants/${etudiant._id}`)
      .send({ moyenne: 25 });
    expect(res.statusCode).toBe(400);
  });

});


describe('DELETE /api/etudiants/:id', () => {

  test("supprime l'étudiant et retourne 200", async () => {
    const etudiant = await Etudiant.create(etudiantValide);
    const res = await request(app).delete(`/api/etudiants/${etudiant._id}`);
    expect(res.statusCode).toBe(200);
    expect(await Etudiant.findById(etudiant._id)).toBeNull();
  });

  test("retourne 404 si l'étudiant n'existe pas", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/etudiants/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  test('retourne 400 pour un ID mal formaté', async () => {
    const res = await request(app).delete('/api/etudiants/id-invalide');
    expect(res.statusCode).toBe(400);
  });

});


describe('GET /api/etudiants/search', () => {

  test('trouve des étudiants par nom', async () => {
    await Etudiant.create(etudiantValide);
    const res = await request(app).get('/api/etudiants/search').query({ nom: 'Dupont' });
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].nom).toBe('Dupont');
  });

  test('aucun résultat si le nom ne correspond à personne', async () => {
    await Etudiant.create(etudiantValide);
    const res = await request(app).get('/api/etudiants/search').query({ nom: 'Inexistant' });
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });

  test('recherche par nom insensible à la casse', async () => {
    await Etudiant.create(etudiantValide);
    const res = await request(app).get('/api/etudiants/search').query({ nom: 'dupont' });
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].nom).toBe('Dupont');
  });

  test('retourne 400 si paramètre nom et q absents', async () => {
    const res = await request(app).get('/api/etudiants/search');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

});


describe('GET /api/etudiants/stats', () => {

  test('retourne des valeurs nulles pour une collection vide', async () => {
    const res = await request(app).get('/api/etudiants/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      count: 0,
      moyenne_generale: null,
      min: null,
      max: null
    });
  });

  test('calcule count, moyenne_generale, min et max', async () => {
    await Etudiant.create([
      { ...etudiantValide, email: 'a1@ecole.tn', moyenne: 10 },
      { ...etudiantValide2, email: 'a2@ecole.tn', moyenne: 20 }
    ]);
    const res = await request(app).get('/api/etudiants/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.min).toBe(10);
    expect(res.body.max).toBe(20);
    expect(res.body.moyenne_generale).toBe(15);
  });

});
