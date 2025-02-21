const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Ruta para iniciar la autenticación
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    }));
});

// Ruta de callback para recibir el código y cambiarlo por un token
app.get('/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
      });
    const access_token = response.data.access_token;
    // Ahora redirigimos a la página principal con el token en la URL
    res.redirect(`/?access_token=${access_token}`);
  } catch (error) {
    console.error(error);
    res.send('Error en el callback');
  }
});

// Ruta para obtener datos del perfil del usuario
app.get('/profile', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send('Error al obtener el perfil');
  }
});

app.get('/top-artists', async (req, res) => {
    const access_token = req.query.access_token;
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.send('Error al obtener artistas');
    }
  });
  
  app.get('/top-tracks', async (req, res) => {
    const access_token = req.query.access_token;
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.send('Error al obtener tracks');
    }
  });
  
  app.get('/currently-playing', async (req, res) => {
    const access_token = req.query.access_token;
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      });
      // Si está reproduciendo algo, Spotify devuelve un 200 con los datos
      // Si no, puede devolver 204 sin contenido
      if (response.status === 200) {
        res.json(response.data);
      } else {
        res.json({ is_playing: false });
      }
    } catch (error) {
      console.error(error);
      res.json({ is_playing: false });
    }
  });
  

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`ONLINE: http://localhost:${port}`);
});
