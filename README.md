# Biblioteca Fibextelecom

Sistema de gestion de biblioteca documental para el Departamento de Sistemas de Fibextelecom.

## Stack Tecnologico

- **Frontend**: React 18, React Bootstrap, Axios
- **Backend**: Node.js, Express, MongoDB
- **Auth**: JWT (JSON Web Tokens)
- **Deploy**: Vercel (frontend) + Railway (backend)

## Funcionalidades

- Gestion de manuales (PDF) con categorias y prioridades
- Sistema de carpetas organizativas
- Gestion de usuarios con roles (admin/usuario)
- Sistema de prestamos/devoluciones
- Historial de descargas
- Notificaciones in-app
- Tema oscuro/claro
- Busqueda avanzada con filtros
- Exportar a Excel

## Desarrollo Local

### Requisitos
- Node.js 18+
- MongoDB local o Atlas

### Backend
```bash
cd backend
npm install
node seed.js          # Crear usuario admin
npm run dev           # Puerto 5000
```

### Frontend
```bash
cd frontend
npm install
npm start             # Puerto 3000
```

### Credenciales por defecto
- Email: admin@fibextelecom.com
- Password: admin123

## Deploy

### Frontend (Vercel)
1. Subir codigo a GitHub
2. Conectar repo en vercel.com
3. Configurar:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
4. Agregar variable de entorno: `REACT_APP_API_URL=https://tu-backend.up.railway.app/api`

### Backend (Railway)
1. Conectar repo en railway.app
2. Agregar variables de entorno:
   - `MONGODB_URI=tu_uri_de_mongodb`
   - `JWT_SECRET=tu_clave_secreta`
   - `PORT=5000`
3. Deploy automatico

## Estructura del Proyecto

```
biblioteca-fibextelecom/
├── backend/
│   ├── server.js
│   ├── models/       (User, Manual, Folder, Prestamo, etc.)
│   ├── routes/       (auth, manuals, folders, prestamos, etc.)
│   └── middleware/    (auth, upload)
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.js
│   │   ├── context/  (AuthContext, ThemeContext)
│   │   ├── pages/    (LoginPage, AdminPanel, MisManuales)
│   │   └── components/
│   └── build/
└── vercel.json
```
