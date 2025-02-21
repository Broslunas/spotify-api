
    // Función para obtener parámetros de la URL
    function getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
      }
      const accessToken = getQueryParam('access_token');
  
      // Elementos del DOM
      const loginDiv = document.getElementById('login');
      const topBar = document.getElementById('topBar');
      const userImg = document.getElementById('userImg');
      const userName = document.getElementById('userName');
      const logoutBtn = document.getElementById('logoutBtn');
      const timeRangeNote = document.getElementById('timeRangeNote');
  
      const currentlyPlayingSection = document.getElementById('currentlyPlayingSection');
      const nowPlayingInfo = document.getElementById('nowPlayingInfo');
  
      const tracksTitle = document.getElementById('tracksTitle');
      const tracksSlider = document.getElementById('tracksSlider');
      const tracksItems = document.getElementById('tracksItems');
  
      const artistsTitle = document.getElementById('artistsTitle');
      const artistsSlider = document.getElementById('artistsSlider');
      const artistsItems = document.getElementById('artistsItems');
  
      const genresTitle = document.getElementById('genresTitle');
      const genresSlider = document.getElementById('genresSlider');
      const genresItems = document.getElementById('genresItems');
  
      // Botones slider
      const tracksLeftBtn = document.getElementById('tracksLeft');
      const tracksRightBtn = document.getElementById('tracksRight');
      const artistsLeftBtn = document.getElementById('artistsLeft');
      const artistsRightBtn = document.getElementById('artistsRight');
      const genresLeftBtn = document.getElementById('genresLeft');
      const genresRightBtn = document.getElementById('genresRight');
  
      // Cerrar sesión: recarga sin token
      logoutBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
  
      // Función para desplazar el slider
      function slide(container, amount) {
        container.scrollBy({ left: amount, behavior: 'smooth' });
      }
      tracksLeftBtn.addEventListener('click', () => slide(tracksItems, -150));
      tracksRightBtn.addEventListener('click', () => slide(tracksItems, 150));
      artistsLeftBtn.addEventListener('click', () => slide(artistsItems, -150));
      artistsRightBtn.addEventListener('click', () => slide(artistsItems, 150));
      genresLeftBtn.addEventListener('click', () => slide(genresItems, -150));
      genresRightBtn.addEventListener('click', () => slide(genresItems, 150));
  
      if (accessToken) {
        // Ocultar login y mostrar barra superior
        loginDiv.style.display = 'none';
        topBar.style.display = 'flex';
        timeRangeNote.style.display = 'block'; // Mostrar el aviso de período
  
        // 1. Obtener perfil del usuario
        fetch(`/profile?access_token=${accessToken}`)
          .then(res => res.json())
          .then(data => {
            userImg.src = (data.images && data.images.length) ? data.images[0].url : 'https://via.placeholder.com/50';
            userName.textContent = data.display_name || 'Usuario Spotify';
          })
          .catch(console.error);
  
        // 2. Ahora reproduciendo (mejorado)
        fetch(`/currently-playing?access_token=${accessToken}`)
          .then(res => res.json())
          .then(data => {
            if (data.is_playing && data.item) {
              currentlyPlayingSection.style.display = 'block';
              nowPlayingInfo.innerHTML = `
                <img src="${data.item.album.images[0]?.url || ''}" alt="Cover">
                <div class="np-info">
                  <p style="margin: 0; font-weight: bold;">${data.item.name}</p>
                  <p style="margin: 0; color: #b3b3b3;">${data.item.artists[0].name}</p>
                </div>
              `;
            } else {
              currentlyPlayingSection.style.display = 'none';
            }
          })
          .catch(() => currentlyPlayingSection.style.display = 'none');
  
        // 3. Obtener canciones más escuchadas y armar slider
        fetch(`/top-tracks?access_token=${accessToken}`)
          .then(res => res.json())
          .then(data => {
            const tracks = data.items || [];
            if (tracks.length) {
              tracksTitle.style.display = 'block';
              tracksSlider.style.display = 'block';
              tracksItems.innerHTML = '';
              tracks.slice(0, 20).forEach(track => {
                const div = document.createElement('div');
                div.className = 'item';
                const imgSrc = track.album.images[0]?.url || '';
                div.innerHTML = `
                  <img src="${imgSrc}" alt="Track">
                  <div class="title" title="${track.name}">${track.name}</div>
                  <div class="subtitle" title="${track.artists[0].name}">${track.artists[0].name}</div>
                `;
                tracksItems.appendChild(div);
              });
            }
          })
          .catch(console.error);
  
        // 4. Obtener artistas más escuchados y armar slider
        fetch(`/top-artists?access_token=${accessToken}`)
          .then(res => res.json())
          .then(data => {
            const artists = data.items || [];
            if (artists.length) {
              artistsTitle.style.display = 'block';
              artistsSlider.style.display = 'block';
              artistsItems.innerHTML = '';
              artists.forEach(artist => {
                const div = document.createElement('div');
                div.className = 'item';
                const imgSrc = (artist.images && artist.images.length) ? artist.images[0].url : 'https://via.placeholder.com/150';
                div.innerHTML = `
                  <img src="${imgSrc}" alt="Artist">
                  <div class="title" title="${artist.name}">${artist.name}</div>
                `;
                artistsItems.appendChild(div);
              });
              // Calcular géneros a partir de los artistas
              const genreCounts = {};
              artists.forEach(artist => {
                artist.genres.forEach(genre => {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
              });
              const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
              if (sortedGenres.length) {
                genresTitle.style.display = 'block';
                genresSlider.style.display = 'block';
                genresItems.innerHTML = '';
                sortedGenres.slice(0, 20).forEach(genre => {
                  const div = document.createElement('div');
                  // Usamos la clase "no-img" para items sin imagen
                  div.className = 'item no-img';
                  div.innerHTML = `
                    <div title="${genre}">${genre}</div>
                  `;
                  genresItems.appendChild(div);
                });
              }
            }
          })
          .catch(console.error);
      }