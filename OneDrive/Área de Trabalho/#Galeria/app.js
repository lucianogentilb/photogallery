// Utilitários
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Chaves de armazenamento
const USERS_KEY = 'photogallery-users';
const PHOTOS_KEY = 'photogallery-photos';
const SESSION_KEY = 'photogallery-session-user';

// Carregar/armazenar dados
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadPhotos() {
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
  } catch {
    return [];
  }
}
function savePhotos(photos) {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Senha hash com SHA-256
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Elementos da interface do usuário de autenticação
const authSectionMain = document.getElementById('auth-section-main');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-form-title');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitch = document.getElementById('auth-switch');
const authMessage = document.getElementById('auth-message');
const authSectionHeader = document.getElementById('auth-section');

// Elementos do aplicativo de galeria
const galleryApp = document.getElementById('gallery-app');
const authSectionHeaderContainer = document.getElementById('auth-section');

const uploadForm = document.getElementById('upload-form');
const photoTitleInput = document.getElementById('photo-title');
const photoDescInput = document.getElementById('photo-description');
const photoFileInput = document.getElementById('photo-fileinput');

const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear');

const photoGallery = document.getElementById('photo-gallery');
const noPhotosMsg = document.getElementById('no-photos-msg');

// Elementos modais para foto ampliada
const modalBackdrop = document.createElement('div');
modalBackdrop.id = 'modal-backdrop';
modalBackdrop.setAttribute('role', 'dialog');
modalBackdrop.setAttribute('aria-modal', 'true');
modalBackdrop.classList = '';
const modalContent = document.createElement('div');
modalContent.id = 'modal-content';
const modalCloseBtn = document.createElement('button');
modalCloseBtn.id = 'modal-close';
modalCloseBtn.setAttribute('aria-label', 'Close enlarged photo');
modalCloseBtn.innerHTML = '&times;';
modalContent.appendChild(modalCloseBtn);
modalBackdrop.appendChild(modalContent);
document.body.appendChild(modalBackdrop);

// Estado
let users = [];
let photos = [];
let currentUser = null;
let isRegisterMode = false;

// Manipuladores de eventos
// Renderizar autenticação no cabeçalho
function renderAuthHeader() {
  authSectionHeader.innerHTML = '';
  if (currentUser) {
    const div = document.createElement('div');
    div.textContent = `Conectado como ${currentUser.username}`;
    div.className = 'logged-in-user';
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Sair';
    logoutBtn.onclick = () => {
      currentUser = null;
      clearSession();
      showAuthScreen();
      renderAuthHeader();
    };
    authSectionHeader.appendChild(div);
    authSectionHeader.appendChild(logoutBtn);
  }
}

// Mostrar tela de autenticação, ocultar aplicativo
function showAuthScreen() {
  galleryApp.classList.add('hidden');
  authSectionMain.classList.remove('hidden');
  authMessage.textContent = '';
  authForm.reset();
  authTitle.textContent = 'Acesso';
  authSubmitBtn.textContent = 'Acesso';
  isRegisterMode = false;
  authSwitch.textContent = "Não tem uma conta? Cadastre-se";
  authSwitch.setAttribute('aria-pressed', 'false');
}

// Mostrar tela do aplicativo, ocultar autenticação
function showAppScreen() {
  authSectionMain.classList.add('hidden');
  galleryApp.classList.remove('hidden');
  photoTitleInput.value = '';
  photoDescInput.value = '';
  photoFileInput.value = '';
  searchInput.value = '';
  renderPhotos(photos);
}

// Renderizar galeria de fotos filtrada por consulta de pesquisa
function renderPhotos(photoArr) {
  photoGallery.innerHTML = '';
  if (photoArr.length === 0) {
    noPhotosMsg.classList.remove('hidden');
  } else {
    noPhotosMsg.classList.add('hidden');
    photoArr.forEach(photo => {
      const card = document.createElement('article');
      card.className = 'photo-card';
      card.tabIndex = 0;
      card.setAttribute('aria-label', `Foto intitulada ${photo.title} por ${photo.uploader}`);

      const img = document.createElement('img');
      img.src = photo.dataUrl;
      img.alt = photo.title;

      const info = document.createElement('div');
      info.className = 'photo-info';

      const title = document.createElement('h3');
      title.className = 'photo-title';
      title.textContent = photo.title;

      const desc = document.createElement('p');
      desc.className = 'photo-desc';
      desc.textContent = photo.description || '';

      const uploader = document.createElement('p');
      uploader.className = 'photo-uploader';
      uploader.textContent = `Carregado por: ${photo.uploader}`;

      info.appendChild(title);
      info.appendChild(desc);
      info.appendChild(uploader);

      card.appendChild(img);
      card.appendChild(info);
      photoGallery.appendChild(card);

      // Clique para abrir a pré-visualização modal
      card.onclick = () => openModal(photo);
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(photo);
        }
      };
    });
  }
}

// Abrir visualização modal para foto
function openModal(photo) {
  modalContent.innerHTML = '';
  modalContent.appendChild(modalCloseBtn);
  const img = document.createElement('img');
  img.src = photo.dataUrl;
  img.alt = photo.title;
  modalContent.appendChild(img);
  modalBackdrop.classList.add('active');
  modalCloseBtn.focus();
}

// Fechar visualização modal
function closeModal() {
  modalBackdrop.classList.remove('active');
}

// Filtrar fotos com base na entrada de pesquisa
function filterPhotos(query) {
  query = query.toLowerCase();
  if (!query) {
    renderPhotos(photos);
    searchClearBtn.style.display = 'none';
    return;
  }
  searchClearBtn.style.display = 'inline-block';
  const filtered = photos.filter(p => {
    return p.title.toLowerCase().includes(query) || p.uploader.toLowerCase().includes(query);
  });
  renderPhotos(filtered);
}

// Registrar novo usuário
async function registerUser(username, password) {
  username = username.trim();
  if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
    throw new Error('O nome de usuário deve ter de 3 a 20 caracteres (letras, números, sublinhado).');
  }
  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('O nome de usuário já existe.');
  }
  const hashed = await sha256(password);
  const user = { username, password: hashed };
  users.push(user);
  saveUsers(users);
  return user;
}

// Acesso de usuário
async function loginUser(username, password) {
  username = username.trim();
  if (!username || !password) {
    throw new Error('Por favor, digite o nome de usuário e a senha.');
  }
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }
  const hashed = await sha256(password);
  if (hashed !== user.password) {
    throw new Error('Senha incorreta.');
  }
  return user;
}

// Carregue a foto e armazene os dados base64 junto com os metadados
function uploadPhoto(title, description, dataUrl, uploader) {
  if (!title) throw new Error('Título é obrigatório.');
  if (!dataUrl) throw new Error('É necessário um arquivo de foto.');
  const photo = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    title,
    description,
    dataUrl,
    uploader
  };
  photos.unshift(photo);
  savePhotos(photos);
  return photo;
}

// Salvar/carregar usuários/fotos/sessão
function saveUsers(arr) {
  localStorage.setItem(USERS_KEY, JSON.stringify(arr));
}
function savePhotos(arr) {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(arr));
}
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function loadPhotos() {
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
  } catch {
    return [];
  }
}
function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Ouvintes de eventos
// Alternar acesso / registro
authSwitch.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  authTitle.textContent = isRegisterMode ? 'Registro' : 'Acesso';
  authSubmitBtn.textContent = isRegisterMode ? 'Registro' : 'Acesso';
  authSwitch.textContent = isRegisterMode ? 'Já tem uma conta? Acesse' : "Não tem uma conta? Cadastre-se";
  authSwitch.setAttribute('aria-pressed', isRegisterMode.toString());
  authMessage.textContent = '';
});
authSwitch.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    authSwitch.click();
  }
});

// Lidar com envio de formulário de autorização
authForm.addEventListener('submit', async e => {
  e.preventDefault();
  authMessage.textContent = '';
  try {
    const username = usernameInput.value;
    const password = passwordInput.value;
    let user;
    if (isRegisterMode) {
      user = await registerUser(username, password);
    } else {
      user = await loginUser(username, password);
    }
    currentUser = user;
    saveSession(user);
    users = loadUsers();
    photos = loadPhotos();
    authSectionHeader.innerText = `Conectado como ${currentUser.username} `;
    renderAuthHeader();
    authSectionMain.classList.add('hidden');
    galleryApp.classList.remove('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
    authMessage.textContent = '';
    renderPhotos(photos);
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

// Lidar com o envio do formulário de carregamento
uploadForm.addEventListener('submit', e => {
  e.preventDefault();
  authMessage.textContent = '';
  const title = photoTitleInput.value.trim();
  const description = photoDescInput.value.trim();
  const fileInput = photoFileInput.files[0];
  if (!fileInput) {
    authMessage.textContent = 'Selecione um arquivo de imagem';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      uploadPhoto(title, description, event.target.result, currentUser.username);
      renderPhotos(photos);
      uploadForm.reset();
      authMessage.textContent = '';
    } catch (err) {
      authMessage.textContent = err.message;
    }
  };
  reader.readAsDataURL(fileInput);
});

// Pesquisando fotos
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderPhotos(photos);
    searchClearBtn.style.display = 'none';
    return;
  }
  searchClearBtn.style.display = 'inline-block';
  const filtered = photos.filter(photo => {
    return photo.title.toLowerCase().includes(query) || photo.uploader.toLowerCase().includes(query);
  });
  renderPhotos(filtered);
});
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  renderPhotos(photos);
  searchClearBtn.style.display = 'none';
  searchInput.focus();
});

// Fechamento modal
modalCloseBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
});
function closeModal() {
  modalBackdrop.classList.remove('active');
  modalContent.innerHTML = '';
}

// Inicializar aplicativo
function init() {
  users = loadUsers();
  photos = loadPhotos();
  currentUser = loadSession();

  if (currentUser) {
    authSectionMain.classList.add('hidden');
    galleryApp.classList.remove('hidden');
    renderAuthHeader();
    renderPhotos(photos);
  } else {
    showAuthScreen();
  }
}

// Mostrar autorização
function showAuthScreen() {
  authSectionMain.classList.remove('hidden');
  galleryApp.classList.add('hidden');
  authMessage.textContent = '';
  authForm.reset();
  authTitle.textContent = 'Acesso';
  authSubmitBtn.textContent = 'Acesso';
  isRegisterMode = false;
  authSwitch.textContent = "Não tem uma conta? Cadastre-se";
  authSwitch.setAttribute('aria-pressed', 'false');
}

init();
