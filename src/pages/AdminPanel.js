import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { API_BASE_URL } from '../api';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Nav, Badge, Spinner, InputGroup, Dropdown, FormCheck } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import {
  FiEdit, FiTrash2, FiDownload, FiEye, FiPlus, FiUsers, FiBook, FiFolder,
  FiActivity, FiLogOut, FiSearch, FiBell, FiSun, FiMoon, FiFilter, FiTag,
  FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiArrowDownCircle,
  FiUser, FiPhone, FiBriefcase, FiCode, FiChevronDown
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('manuales');
  const [manuales, setManuales] = useState([]);
  const [folders, setFolders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ porUsuario: [], porManual: [] });
  const [logs, setLogs] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoStats, setPrestamoStats] = useState({ activos: 0, devueltos: 0, vencidos: 0 });
  const [downloads, setDownloads] = useState([]);
  const [downloadStats, setDownloadStats] = useState({ porUsuario: [], porManual: [] });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFolderAssignModal, setShowFolderAssignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPrestamoModal, setShowPrestamoModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [assigningManualId, setAssigningManualId] = useState(null);
  const [assigningFolderId, setAssigningFolderId] = useState(null);

  const [manualForm, setManualForm] = useState({
    titulo: '', descripcion: '', categoria: 'Manuales', archivo: null, folder_id: '',
    fecha_vencimiento: '', prioridad: 'media', version: '', autor: '', tags: '', vistas: 0
  });
  const [userForm, setUserForm] = useState({
    nombre: '', email: '', password: '', rol: 'usuario', departamento: 'Sistemas',
    telefono: '', cargo: '', foto: null, activo: true
  });
  const [folderForm, setFolderForm] = useState({ nombre: '', descripcion: '' });
  const [prestamoForm, setPrestamoForm] = useState({
    usuario: '', manual: '', fecha_devolucion_esperada: '', observaciones: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const categories = [
    'Manuales', 'Instructivo',
    ...new Set(manuales.map(m => m.categoria).filter(c => c && c !== 'Manuales' && c !== 'Instructivo'))
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [manualesRes, foldersRes, usersRes, statsRes, logsRes, prestamosRes, prestamoStatsRes, downloadsRes, downloadStatsRes] = await Promise.all([
        api.get('/manuals/all'),
        api.get('/folders'),
        api.get('/auth/users'),
        api.get('/activity/stats'),
        api.get('/activity/logs'),
        api.get('/prestamos'),
        api.get('/prestamos/stats'),
        api.get('/downloads'),
        api.get('/downloads/stats')
      ]);
      setManuales(manualesRes.data);
      setFolders(foldersRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setPrestamos(prestamosRes.data);
      setPrestamoStats(prestamoStatsRes.data);
      setDownloads(downloadsRes.data);
      setDownloadStats(downloadStatsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notiRes, unreadRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread')
      ]);
      setNotifications(notiRes.data);
      setUnreadCount(unreadRes.data.count || unreadRes.data.unread || 0);
    } catch (error) {
      // silent
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, filename);
  };

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error al marcar notificacion');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Error al marcar notificaciones');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('titulo', manualForm.titulo);
      formData.append('descripcion', manualForm.descripcion);
      formData.append('categoria', manualForm.categoria === '__nueva__' ? newCategory : manualForm.categoria);
      formData.append('folder_id', manualForm.folder_id || '');
      formData.append('fecha_vencimiento', manualForm.fecha_vencimiento || '');
      formData.append('prioridad', manualForm.prioridad);
      formData.append('version', manualForm.version);
      formData.append('autor', manualForm.autor);
      formData.append('tags', manualForm.tags);
      if (manualForm.archivo) formData.append('archivo', manualForm.archivo);
      if (editingItem) {
        await api.put(`/manuals/${editingItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Manual actualizado');
      } else {
        await api.post('/manuals', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Manual creado');
      }
      setShowManualModal(false);
      setEditingItem(null);
      setManualForm({
        titulo: '', descripcion: '', categoria: 'Manuales', archivo: null, folder_id: '',
        fecha_vencimiento: '', prioridad: 'media', version: '', autor: '', tags: '', vistas: 0
      });
      fetchData();
    } catch (error) {
      toast.error('Error al guardar manual');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const updateData = { ...userForm };
        if (!updateData.password) delete updateData.password;
        if (updateData.foto === null) delete updateData.foto;
        await api.put(`/auth/users/${editingItem._id}`, updateData);
        toast.success('Usuario actualizado');
      } else {
        const formData = new FormData();
        formData.append('nombre', userForm.nombre);
        formData.append('email', userForm.email);
        formData.append('password', userForm.password);
        formData.append('rol', userForm.rol);
        formData.append('departamento', userForm.departamento);
        formData.append('telefono', userForm.telefono);
        formData.append('cargo', userForm.cargo);
        formData.append('activo', userForm.activo);
        if (userForm.foto) formData.append('foto', userForm.foto);
        await api.post('/auth/users', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Usuario creado');
      }
      setShowUserModal(false);
      setEditingItem(null);
      setUserForm({
        nombre: '', email: '', password: '', rol: 'usuario', departamento: 'Sistemas',
        telefono: '', cargo: '', foto: null, activo: true
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleFolderSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/folders/${editingItem._id}`, folderForm);
        toast.success('Carpeta actualizada');
      } else {
        await api.post('/folders', folderForm);
        toast.success('Carpeta creada');
      }
      setShowFolderModal(false);
      setEditingItem(null);
      setFolderForm({ nombre: '', descripcion: '' });
      fetchData();
    } catch (error) {
      toast.error('Error al guardar carpeta');
    }
  };

  const handlePrestamoSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/prestamos/${editingItem._id}`, prestamoForm);
        toast.success('Prestamo actualizado');
      } else {
        await api.post('/prestamos', prestamoForm);
        toast.success('Prestamo creado');
      }
      setShowPrestamoModal(false);
      setEditingItem(null);
      setPrestamoForm({ usuario: '', manual: '', fecha_devolucion_esperada: '', observaciones: '' });
      fetchData();
    } catch (error) {
      toast.error('Error al guardar prestamo');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Estas seguro de eliminar este elemento?')) return;
    try {
      if (type === 'manual') await api.delete(`/manuals/${id}`);
      if (type === 'user') await api.delete(`/auth/users/${id}`);
      if (type === 'folder') await api.delete(`/folders/${id}`);
      toast.success('Eliminado correctamente');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleReturnPrestamo = async (id) => {
    if (!window.confirm('¿Confirmar devolucion del prestamo?')) return;
    try {
      await api.put(`/prestamos/${id}/devolver`);
      toast.success('Prestamo devuelto correctamente');
      fetchData();
    } catch (error) {
      toast.error('Error al devolver prestamo');
    }
  };

  const handleDeletePrestamo = async (id) => {
    if (!window.confirm('¿Estas seguro de eliminar este prestamo?')) return;
    try {
      await api.delete(`/prestamos/${id}`);
      toast.success('Prestamo eliminado');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar prestamo');
    }
  };

  const handleDownload = async (manual) => {
    try {
      const response = await api.get(`/manuals/download/${manual._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${manual.titulo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al descargar');
    }
  };

  const handlePreview = (manual) => {
    const token = localStorage.getItem('token');
    setPreviewUrl(`${API_BASE_URL}/manuals/preview/${manual._id}?token=${token}`);
    setShowPreviewModal(true);
  };

  const openEditManual = (manual) => {
    setEditingItem(manual);
    setManualForm({
      titulo: manual.titulo,
      descripcion: manual.descripcion,
      categoria: manual.categoria,
      archivo: null,
      folder_id: manual.folder_id?._id || '',
      fecha_vencimiento: manual.fecha_vencimiento ? manual.fecha_vencimiento.split('T')[0] : '',
      prioridad: manual.prioridad || 'media',
      version: manual.version || '',
      autor: manual.autor || '',
      tags: Array.isArray(manual.tags) ? manual.tags.join(', ') : (manual.tags || ''),
      vistas: manual.vistas || 0
    });
    setShowManualModal(true);
  };

  const openEditUser = (u) => {
    setEditingItem(u);
    setUserForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol,
      departamento: u.departamento,
      telefono: u.telefono || '',
      cargo: u.cargo || '',
      foto: null,
      activo: u.activo !== false
    });
    setShowUserModal(true);
  };

  const openEditFolder = (folder) => {
    setEditingItem(folder);
    setFolderForm({ nombre: folder.nombre, descripcion: folder.descripcion });
    setShowFolderModal(true);
  };

  const openAssignManual = (manual) => {
    setAssigningManualId(manual._id);
    setSelectedUsers(manual.asignados?.map(u => u._id) || []);
    setShowAssignModal(true);
  };

  const openFolderAssign = (folder) => {
    setAssigningFolderId(folder._id);
    setSelectedUsers(folder.usuarios?.map(u => u._id) || []);
    setShowFolderAssignModal(true);
  };

  const openEditPrestamo = (prestamo) => {
    setEditingItem(prestamo);
    setPrestamoForm({
      usuario: prestamo.usuario?._id || '',
      manual: prestamo.manual?._id || '',
      fecha_devolucion_esperada: prestamo.fecha_devolucion_esperada ? prestamo.fecha_devolucion_esperada.split('T')[0] : '',
      observaciones: prestamo.observaciones || ''
    });
    setShowPrestamoModal(true);
  };

  const handleAssignUsers = async () => {
    try {
      await api.put(`/manuals/${assigningManualId}`, { asignados: JSON.stringify(selectedUsers) });
      toast.success('Usuarios asignados al manual');
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error al asignar usuarios');
    }
  };

  const handleFolderAssignUsers = async () => {
    try {
      await api.post(`/folders/${assigningFolderId}/usuarios`, { usuarios: selectedUsers });
      toast.success('Usuarios asignados a carpeta');
      setShowFolderAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error al asignar usuarios');
    }
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'critica': return colors.danger;
      case 'alta': return colors.warning;
      case 'media': return colors.info;
      case 'baja': return colors.secondary;
      default: return colors.secondary;
    }
  };

  const getPriorityBg = (prioridad) => {
    switch (prioridad) {
      case 'critica': return 'danger';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baja': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'prestado': return 'warning';
      case 'devuelto': return 'success';
      case 'vencido': return 'danger';
      default: return 'secondary';
    }
  };

  const filteredManuales = manuales.filter(m => {
    const matchesSearch = m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || m.categoria === categoryFilter;
    const matchesPriority = !priorityFilter || m.prioridad === priorityFilter;
    const matchesAuthor = !authorFilter || m.autor?.toLowerCase().includes(authorFilter.toLowerCase());
    const matchesTags = !tagsFilter || (Array.isArray(m.tags)
      ? m.tags.some(t => t.toLowerCase().includes(tagsFilter.toLowerCase()))
      : m.tags?.toLowerCase().includes(tagsFilter.toLowerCase()));
    const matchesDateFrom = !dateFrom || (m.fecha_vencimiento && new Date(m.fecha_vencimiento) >= new Date(dateFrom));
    const matchesDateTo = !dateTo || (m.fecha_vencimiento && new Date(m.fecha_vencimiento) <= new Date(dateTo));
    return matchesSearch && matchesCategory && matchesPriority && matchesAuthor && matchesTags && matchesDateFrom && matchesDateTo;
  });

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrestamos = prestamos.filter(p =>
    p.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.manual?.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div style={{ background: colors.headerGradient, padding: '12px 0' }}>
        <Container fluid className="d-flex justify-content-between align-items-center px-4">
          <div className="d-flex align-items-center">
            <h4 className="text-white fw-bold mb-0">Panel de Administracion</h4>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50">{user?.nombre}</span>
            <Button variant="outline-light" size="sm" onClick={toggleTheme} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}>
              {theme === 'light' ? <FiMoon /> : <FiSun />}
            </Button>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" size="sm" id="notif-dropdown" style={{ position: 'relative' }}>
                <FiBell />
                {unreadCount > 0 && (
                  <Badge bg="danger" pill style={{ position: 'absolute', top: -4, right: -4, fontSize: '0.6rem', padding: '2px 5px' }}>
                    {unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: '370px', maxHeight: '450px', overflowY: 'auto', backgroundColor: colors.bgCard, borderColor: colors.border }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <strong style={{ color: colors.text, fontSize: '0.95rem' }}>Notificaciones</strong>
                  {unreadCount > 0 && (
                    <Button variant="link" size="sm" onClick={markAllAsRead} style={{ color: colors.primary, fontSize: '0.8rem', textDecoration: 'none' }}>
                      Marcar todas leidas
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-4" style={{ color: colors.textMuted }}>Sin notificaciones</div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <Dropdown.Item key={n._id} onClick={() => markNotificationRead(n._id)}
                      style={{
                        backgroundColor: n.read ? 'transparent' : colors.tableHover,
                        color: colors.text,
                        padding: '10px 16px',
                        borderBottom: `1px solid ${colors.border}`
                      }}>
                      <div style={{ fontSize: '0.88rem' }}>{n.mensaje || n.message}</div>
                      <small style={{ color: colors.textMuted }}>{new Date(n.createdAt).toLocaleString()}</small>
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <FiLogOut /> Cerrar Sesion
            </Button>
          </div>
        </Container>
      </div>

      {/* Tabs */}
      <Container fluid className="px-4 mt-3">
        <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav.Item><Nav.Link eventKey="manuales" style={{ color: activeTab === 'manuales' ? colors.primary : colors.textMuted }}><FiBook /> Manuales</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="carpetas" style={{ color: activeTab === 'carpetas' ? colors.primary : colors.textMuted }}><FiFolder /> Carpetas</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="usuarios" style={{ color: activeTab === 'usuarios' ? colors.primary : colors.textMuted }}><FiUsers /> Usuarios</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="prestamos" style={{ color: activeTab === 'prestamos' ? colors.primary : colors.textMuted }}><FiClock /> Prestamos</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="descargas" style={{ color: activeTab === 'descargas' ? colors.primary : colors.textMuted }}><FiArrowDownCircle /> Descargas</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="actividad" style={{ color: activeTab === 'actividad' ? colors.primary : colors.textMuted }}><FiActivity /> Actividad</Nav.Link></Nav.Item>
        </Nav>
      </Container>

      {/* Content */}
      <Container fluid className="px-4 py-3">
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" style={{ color: colors.primary }} /></div>
        ) : (
          <>

            {/* MANUALES TAB */}
            {activeTab === 'manuales' && (
              <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                <Card.Body>
                  <Row className="mb-3 align-items-center">
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMuted }}><FiSearch /></InputGroup.Text>
                        <Form.Control placeholder="Buscar manuales..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
                      </InputGroup>
                    </Col>
                    <Col md={2}>
                      <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={inputStyle}>
                        <option value="">Todas las categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </Form.Select>
                    </Col>
                    <Col md={1}>
                      <Button variant={showFilters ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setShowFilters(!showFilters)} className="w-100">
                        <FiFilter />
                      </Button>
                    </Col>
                    <Col md={6} className="text-end">
                      <Button variant="success" className="me-2" onClick={() => exportToExcel(
                        filteredManuales.map(m => ({
                          Titulo: m.titulo, Categoria: m.categoria, Descripcion: m.descripcion,
                          Prioridad: m.prioridad, Autor: m.autor, Version: m.version,
                          Tags: Array.isArray(m.tags) ? m.tags.join(', ') : m.tags || '',
                          Vistas: m.vistas || 0, Vencimiento: m.fecha_vencimiento ? new Date(m.fecha_vencimiento).toLocaleDateString() : '',
                          Asignados: m.asignados?.map(a => a.nombre).join(', ') || 'Ninguno'
                        })),
                        'Manuales_Fibextelecom.xlsx'
                      )}>
                        Exportar Excel
                      </Button>
                      <Button variant="primary" onClick={() => {
                        setEditingItem(null);
                        setManualForm({
                          titulo: '', descripcion: '', categoria: 'Manuales', archivo: null, folder_id: '',
                          fecha_vencimiento: '', prioridad: 'media', version: '', autor: '', tags: '', vistas: 0
                        });
                        setShowManualModal(true);
                      }}>
                        <FiPlus /> Nuevo Manual
                      </Button>
                    </Col>
                  </Row>

                  {showFilters && (
                    <Row className="mb-3 p-3 rounded" style={{ backgroundColor: colors.tableHover, border: `1px solid ${colors.border}` }}>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label style={{ color: colors.textMuted, fontSize: '0.85rem' }}><FiAlertCircle /> Prioridad</Form.Label>
                          <Form.Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={inputStyle} size="sm">
                            <option value="">Todas</option>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Critica</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label style={{ color: colors.textMuted, fontSize: '0.85rem' }}><FiCalendar /> Desde</Form.Label>
                          <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} size="sm" />
                        </Form.Group>
                      </Col>
                      <Col md={2}>
                        <Form.Group>
                          <Form.Label style={{ color: colors.textMuted, fontSize: '0.85rem' }}><FiCalendar /> Hasta</Form.Label>
                          <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} size="sm" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label style={{ color: colors.textMuted, fontSize: '0.85rem' }}><FiUser /> Autor</Form.Label>
                          <Form.Control placeholder="Filtrar por autor..." value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} style={inputStyle} size="sm" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label style={{ color: colors.textMuted, fontSize: '0.85rem' }}><FiTag /> Tags</Form.Label>
                          <Form.Control placeholder="Filtrar por tag..." value={tagsFilter} onChange={(e) => setTagsFilter(e.target.value)} style={inputStyle} size="sm" />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <Table striped bordered hover responsive style={{ borderColor: colors.border }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.tableHover }}>
                        <th style={{ color: colors.text }}>Titulo</th>
                        <th style={{ color: colors.text }}>Categoria</th>
                        <th style={{ color: colors.text }}>Prioridad</th>
                        <th style={{ color: colors.text }}>Autor</th>
                        <th style={{ color: colors.text }}>Version</th>
                        <th style={{ color: colors.text }}>Tags</th>
                        <th style={{ color: colors.text }}>Vistas</th>
                        <th style={{ color: colors.text }}>Vencimiento</th>
                        <th style={{ color: colors.text }}>Asignados</th>
                        <th style={{ color: colors.text }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredManuales.map(m => (
                        <tr key={m._id}>
                          <td style={{ color: colors.text }}>{m.titulo}</td>
                          <td><Badge bg="info">{m.categoria}</Badge></td>
                          <td><Badge bg={getPriorityBg(m.prioridad)}>{m.prioridad || 'media'}</Badge></td>
                          <td style={{ color: colors.text }}>{m.autor || <span style={{ color: colors.textMuted }}>-</span>}</td>
                          <td style={{ color: colors.text }}>{m.version || <span style={{ color: colors.textMuted }}>-</span>}</td>
                          <td>
                            {Array.isArray(m.tags) ? m.tags.map((tag, i) => (
                              <Badge key={i} bg="secondary" className="me-1" style={{ fontSize: '0.7rem' }}>{tag}</Badge>
                            )) : m.tags ? <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{m.tags}</Badge> : <span style={{ color: colors.textMuted }}>-</span>}
                          </td>
                          <td style={{ color: colors.text }}>{m.vistas || 0}</td>
                          <td style={{ color: colors.text }}>{m.fecha_vencimiento ? new Date(m.fecha_vencimiento).toLocaleDateString() : <span style={{ color: colors.textMuted }}>-</span>}</td>
                          <td style={{ color: colors.text }}>{m.asignados?.map(a => a.nombre).join(', ') || <span style={{ color: colors.textMuted }}>Ninguno</span>}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEditManual(m)}><FiEdit /></Button>
                            <Button variant="outline-danger" size="sm" className="me-1" onClick={() => handleDelete('manual', m._id)}><FiTrash2 /></Button>
                            <Button variant="outline-info" size="sm" className="me-1" onClick={() => openAssignManual(m)}><FiUsers /></Button>
                            {m.archivo && (
                              <>
                                <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleDownload(m)}><FiDownload /></Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => handlePreview(m)}><FiEye /></Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* CARPETAS TAB */}
            {activeTab === 'carpetas' && (
              <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <h5 style={{ color: colors.text }}>Gestion de Carpetas</h5>
                    <Button variant="primary" onClick={() => {
                      setEditingItem(null);
                      setFolderForm({ nombre: '', descripcion: '' });
                      setShowFolderModal(true);
                    }}>
                      <FiPlus /> Nueva Carpeta
                    </Button>
                  </div>
                  <Row>
                    {folders.map(folder => (
                      <Col md={4} key={folder._id} className="mb-3">
                        <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                          <Card.Body>
                            <Card.Title style={{ color: colors.text }}>{folder.nombre}</Card.Title>
                            <Card.Text style={{ color: colors.textMuted }}>{folder.descripcion}</Card.Text>
                            <p className="small" style={{ color: colors.text }}><strong>Manuales:</strong> {folder.manuales?.length || 0}</p>
                            <p className="small" style={{ color: colors.text }}><strong>Usuarios:</strong> {folder.usuarios?.length || 0}</p>
                            <div>
                              <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEditFolder(folder)}><FiEdit /></Button>
                              <Button variant="outline-danger" size="sm" className="me-1" onClick={() => handleDelete('folder', folder._id)}><FiTrash2 /></Button>
                              <Button variant="outline-info" size="sm" onClick={() => openFolderAssign(folder)}><FiUsers /></Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
              <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                <Card.Body>
                  <Row className="mb-3 align-items-center">
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMuted }}><FiSearch /></InputGroup.Text>
                        <Form.Control placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
                      </InputGroup>
                    </Col>
                    <Col md={6} className="text-end">
                      <Button variant="success" className="me-2" onClick={() => exportToExcel(
                        filteredUsers.map(u => ({
                          Nombre: u.nombre, Email: u.email, Rol: u.rol,
                          Departamento: u.departamento, Telefono: u.telefono || '',
                          Cargo: u.cargo || '', Activo: u.activo !== false ? 'Si' : 'No'
                        })),
                        'Usuarios_Fibextelecom.xlsx'
                      )}>
                        Exportar Excel
                      </Button>
                      <Button variant="primary" onClick={() => {
                        setEditingItem(null);
                        setUserForm({
                          nombre: '', email: '', password: '', rol: 'usuario', departamento: 'Sistemas',
                          telefono: '', cargo: '', foto: null, activo: true
                        });
                        setShowUserModal(true);
                      }}>
                        <FiPlus /> Nuevo Usuario
                      </Button>
                    </Col>
                  </Row>
                  <Table striped bordered hover responsive style={{ borderColor: colors.border }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.tableHover }}>
                        <th style={{ color: colors.text }}>Nombre</th>
                        <th style={{ color: colors.text }}>Email</th>
                        <th style={{ color: colors.text }}>Rol</th>
                        <th style={{ color: colors.text }}>Departamento</th>
                        <th style={{ color: colors.text }}>Telefono</th>
                        <th style={{ color: colors.text }}>Cargo</th>
                        <th style={{ color: colors.text }}>Activo</th>
                        <th style={{ color: colors.text }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u._id}>
                          <td style={{ color: colors.text }}>{u.nombre}</td>
                          <td style={{ color: colors.text }}>{u.email}</td>
                          <td><Badge bg={u.rol === 'admin' ? 'warning' : 'secondary'}>{u.rol}</Badge></td>
                          <td style={{ color: colors.text }}>{u.departamento}</td>
                          <td style={{ color: colors.text }}>{u.telefono || <span style={{ color: colors.textMuted }}>-</span>}</td>
                          <td style={{ color: colors.text }}>{u.cargo || <span style={{ color: colors.textMuted }}>-</span>}</td>
                          <td>
                            <Badge bg={u.activo !== false ? 'success' : 'danger'}>
                              {u.activo !== false ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEditUser(u)}><FiEdit /></Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete('user', u._id)}><FiTrash2 /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* PRESTAMOS TAB */}
            {activeTab === 'prestamos' && (
              <Row>
                <Col md={12} className="mb-3">
                  <Row>
                    <Col md={4}>
                      <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                        <Card.Body className="text-center">
                          <FiClock size={28} style={{ color: colors.warning }} />
                          <h3 style={{ color: colors.text }}>{prestamoStats.activos || 0}</h3>
                          <small style={{ color: colors.textMuted }}>Prestamos Activos</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                        <Card.Body className="text-center">
                          <FiCheckCircle size={28} style={{ color: colors.success }} />
                          <h3 style={{ color: colors.text }}>{prestamoStats.devueltos || 0}</h3>
                          <small style={{ color: colors.textMuted }}>Devueltos</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                        <Card.Body className="text-center">
                          <FiAlertCircle size={28} style={{ color: colors.danger }} />
                          <h3 style={{ color: colors.text }}>{prestamoStats.vencidos || 0}</h3>
                          <small style={{ color: colors.textMuted }}>Vencidos</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
                <Col md={12}>
                  <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                    <Card.Body>
                      <Row className="mb-3 align-items-center">
                        <Col md={6}>
                          <InputGroup>
                            <InputGroup.Text style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMuted }}><FiSearch /></InputGroup.Text>
                            <Form.Control placeholder="Buscar prestamos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
                          </InputGroup>
                        </Col>
                        <Col md={6} className="text-end">
                          <Button variant="success" className="me-2" onClick={() => exportToExcel(
                            filteredPrestamos.map(p => ({
                              Usuario: p.usuario?.nombre || '',
                              Manual: p.manual?.titulo || '',
                              'Fecha Prestamo': p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString() : '',
                              'Fecha Dev. Esperada': p.fecha_devolucion_esperada ? new Date(p.fecha_devolucion_esperada).toLocaleDateString() : '',
                              'Fecha Dev. Real': p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : '',
                              Estado: p.estado || '',
                              Observaciones: p.observaciones || ''
                            })),
                            'Prestamos_Fibextelecom.xlsx'
                          )}>
                            Exportar Excel
                          </Button>
                          <Button variant="primary" onClick={() => {
                            setEditingItem(null);
                            setPrestamoForm({ usuario: '', manual: '', fecha_devolucion_esperada: '', observaciones: '' });
                            setShowPrestamoModal(true);
                          }}>
                            <FiPlus /> Nuevo Prestamo
                          </Button>
                        </Col>
                      </Row>
                      <Table striped bordered hover responsive style={{ borderColor: colors.border }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.tableHover }}>
                            <th style={{ color: colors.text }}>Usuario</th>
                            <th style={{ color: colors.text }}>Manual</th>
                            <th style={{ color: colors.text }}>Fecha Prestamo</th>
                            <th style={{ color: colors.text }}>Dev. Esperada</th>
                            <th style={{ color: colors.text }}>Dev. Real</th>
                            <th style={{ color: colors.text }}>Estado</th>
                            <th style={{ color: colors.text }}>Observaciones</th>
                            <th style={{ color: colors.text }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPrestamos.map(p => (
                            <tr key={p._id}>
                              <td style={{ color: colors.text }}>{p.usuario?.nombre || '-'}</td>
                              <td style={{ color: colors.text }}>{p.manual?.titulo || '-'}</td>
                              <td style={{ color: colors.text }}>{p.fecha_prestamo ? new Date(p.fecha_prestamo).toLocaleDateString() : '-'}</td>
                              <td style={{ color: colors.text }}>{p.fecha_devolucion_esperada ? new Date(p.fecha_devolucion_esperada).toLocaleDateString() : '-'}</td>
                              <td style={{ color: colors.text }}>{p.fecha_devolucion_real ? new Date(p.fecha_devolucion_real).toLocaleDateString() : <span style={{ color: colors.textMuted }}>-</span>}</td>
                              <td><Badge bg={getEstadoBadge(p.estado)}>{p.estado || 'prestado'}</Badge></td>
                              <td style={{ color: colors.text }}>{p.observaciones || <span style={{ color: colors.textMuted }}>-</span>}</td>
                              <td>
                                {p.estado !== 'devuelto' && (
                                  <Button variant="outline-success" size="sm" className="me-1" onClick={() => handleReturnPrestamo(p._id)} title="Devolver">
                                    <FiCheckCircle />
                                  </Button>
                                )}
                                <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEditPrestamo(p)}><FiEdit /></Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDeletePrestamo(p._id)}><FiTrash2 /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* DESCARGAS TAB */}
            {activeTab === 'descargas' && (
              <Row>
                <Col md={12} className="mb-3">
                  <Row>
                    <Col md={6}>
                      <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                        <Card.Header style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.text }}>Descargas por Usuario</Card.Header>
                        <Card.Body>
                          {downloadStats.porUsuario?.length > 0 ? downloadStats.porUsuario.map((s, i) => (
                            <div key={i} className="d-flex justify-content-between mb-2">
                              <span style={{ color: colors.text }}>{s.nombre}</span>
                              <Badge bg="primary">{s.cantidad} descargas</Badge>
                            </div>
                          )) : <p style={{ color: colors.textMuted }}>Sin datos</p>}
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                        <Card.Header style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.text }}>Descargas por Manual</Card.Header>
                        <Card.Body>
                          {downloadStats.porManual?.length > 0 ? downloadStats.porManual.map((s, i) => (
                            <div key={i} className="d-flex justify-content-between mb-2">
                              <span style={{ color: colors.text }}>{s.nombre}</span>
                              <Badge bg="success">{s.cantidad} descargas</Badge>
                            </div>
                          )) : <p style={{ color: colors.textMuted }}>Sin datos</p>}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
                <Col md={12}>
                  <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-3">
                        <h5 style={{ color: colors.text }}>Historial de Descargas</h5>
                        <Button variant="success" size="sm" onClick={() => exportToExcel(
                          downloads.map(d => ({
                            Usuario: d.usuario?.nombre || d.user?.nombre || '',
                            Manual: d.manual?.titulo || '',
                            Fecha: d.createdAt ? new Date(d.createdAt).toLocaleString() : '',
                            'Tipo Accion': d.accion || d.action || '',
                            Tamano: d.tamano || d.size || ''
                          })),
                          'Descargas_Fibextelecom.xlsx'
                        )}>
                          Exportar Excel
                        </Button>
                      </div>
                      <Table striped bordered hover responsive style={{ borderColor: colors.border }}>
                        <thead>
                          <tr style={{ backgroundColor: colors.tableHover }}>
                            <th style={{ color: colors.text }}>Usuario</th>
                            <th style={{ color: colors.text }}>Manual</th>
                            <th style={{ color: colors.text }}>Fecha</th>
                            <th style={{ color: colors.text }}>Tipo de Accion</th>
                            <th style={{ color: colors.text }}>Tamano</th>
                          </tr>
                        </thead>
                        <tbody>
                          {downloads.map((d, i) => (
                            <tr key={d._id || i}>
                              <td style={{ color: colors.text }}>{d.usuario?.nombre || d.user?.nombre || '-'}</td>
                              <td style={{ color: colors.text }}>{d.manual?.titulo || '-'}</td>
                              <td style={{ color: colors.text }}>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</td>
                              <td>
                                <Badge bg={d.accion === 'download' || d.action === 'download' ? 'success' : 'info'}>
                                  {d.accion || d.action || '-'}
                                </Badge>
                              </td>
                              <td style={{ color: colors.text }}>{d.tamano || d.size || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* ACTIVIDAD TAB */}
            {activeTab === 'actividad' && (
              <Row>
                <Col md={6}>
                  <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }} className="mb-3">
                    <Card.Header style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.text }}>Manuales por Usuario</Card.Header>
                    <Card.Body>
                      {stats.porUsuario.length > 0 ? stats.porUsuario.map((s, i) => (
                        <div key={i} className="d-flex justify-content-between mb-2">
                          <span style={{ color: colors.text }}>{s.nombre}</span>
                          <Badge bg="primary">{s.cantidad} manuales</Badge>
                        </div>
                      )) : <p style={{ color: colors.textMuted }}>Sin datos</p>}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }} className="mb-3">
                    <Card.Header style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.text }}>Usuarios por Manual</Card.Header>
                    <Card.Body>
                      {stats.porManual.length > 0 ? stats.porManual.map((s, i) => (
                        <div key={i} className="d-flex justify-content-between mb-2">
                          <span style={{ color: colors.text }}>{s.nombre}</span>
                          <Badge bg="success">{s.cantidad} usuarios</Badge>
                        </div>
                      )) : <p style={{ color: colors.textMuted }}>Sin datos</p>}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Card style={{ backgroundColor: colors.bgCard, borderColor: colors.border, boxShadow: colors.cardShadow }}>
                    <Card.Header style={{ backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.text }}>Registro de Actividad</Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="d-flex justify-content-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <span style={{ color: colors.text }}><strong>{log.user?.nombre || 'Sistema'}</strong> {log.action}</span>
                          <small style={{ color: colors.textMuted }}>{new Date(log.timestamp).toLocaleString()}</small>
                        </div>
                      )) : <p style={{ color: colors.textMuted }}>Sin actividad registrada</p>}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>

      {/* Manual Modal */}
      <Modal show={showManualModal} onHide={() => { setShowManualModal(false); setEditingItem(null); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>{editingItem ? 'Editar Manual' : 'Nuevo Manual'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManualSubmit}>
          <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text }}>
            <Form.Group className="mb-3">
              <Form.Label>Titulo</Form.Label>
              <Form.Control value={manualForm.titulo} onChange={(e) => setManualForm({ ...manualForm, titulo: e.target.value })} required style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripcion</Form.Label>
              <Form.Control as="textarea" rows={3} value={manualForm.descripcion} onChange={(e) => setManualForm({ ...manualForm, descripcion: e.target.value })} style={inputStyle} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select value={manualForm.categoria} onChange={(e) => setManualForm({ ...manualForm, categoria: e.target.value })} style={inputStyle}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__nueva__">+ Nueva Categoria</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                {manualForm.categoria === '__nueva__' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Nueva Categoria</Form.Label>
                    <Form.Control value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nombre de la categoria" style={inputStyle} />
                  </Form.Group>
                )}
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><FiAlertCircle /> Prioridad</Form.Label>
                  <Form.Select value={manualForm.prioridad} onChange={(e) => setManualForm({ ...manualForm, prioridad: e.target.value })} style={inputStyle}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Critica</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><FiCode /> Version</Form.Label>
                  <Form.Control value={manualForm.version} onChange={(e) => setManualForm({ ...manualForm, version: e.target.value })} placeholder="ej. 1.0" style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><FiUser /> Autor</Form.Label>
                  <Form.Control value={manualForm.autor} onChange={(e) => setManualForm({ ...manualForm, autor: e.target.value })} placeholder="Nombre del autor" style={inputStyle} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FiTag /> Tags (separados por coma)</Form.Label>
                  <Form.Control value={manualForm.tags} onChange={(e) => setManualForm({ ...manualForm, tags: e.target.value })} placeholder="tag1, tag2, tag3" style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FiCalendar /> Fecha de Vencimiento</Form.Label>
                  <Form.Control type="date" value={manualForm.fecha_vencimiento} onChange={(e) => setManualForm({ ...manualForm, fecha_vencimiento: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Archivo PDF</Form.Label>
              <Form.Control type="file" accept=".pdf" onChange={(e) => setManualForm({ ...manualForm, archivo: e.target.files[0] })} style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Carpeta</Form.Label>
              <Form.Select value={manualForm.folder_id} onChange={(e) => setManualForm({ ...manualForm, folder_id: e.target.value })} style={inputStyle}>
                <option value="">Sin carpeta</option>
                {folders.map(f => <option key={f._id} value={f._id}>{f.nombre}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
            <Button variant="secondary" onClick={() => { setShowManualModal(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => { setShowUserModal(false); setEditingItem(null); }}>
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>{editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUserSubmit}>
          <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text }}>
            <Form.Group className="mb-3">
              <Form.Label><FiUser /> Nombre</Form.Label>
              <Form.Control value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} required style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contrasena {editingItem && '(dejar vacio para no cambiar)'}</Form.Label>
              <Form.Control type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required={!editingItem} style={inputStyle} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select value={userForm.rol} onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })} style={inputStyle}>
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Departamento</Form.Label>
                  <Form.Control value={userForm.departamento} onChange={(e) => setUserForm({ ...userForm, departamento: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FiPhone /> Telefono</Form.Label>
                  <Form.Control value={userForm.telefono} onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })} placeholder="Numero de telefono" style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><FiBriefcase /> Cargo</Form.Label>
                  <Form.Control value={userForm.cargo} onChange={(e) => setUserForm({ ...userForm, cargo: e.target.value })} placeholder="Cargo del usuario" style={inputStyle} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Foto de perfil</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e) => setUserForm({ ...userForm, foto: e.target.files[0] })} style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3 d-flex align-items-center" style={{ height: '100%', paddingTop: '30px' }}>
                  <FormCheck
                    type="switch"
                    id="activo-switch"
                    label="Activo"
                    checked={userForm.activo}
                    onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
            <Button variant="secondary" onClick={() => { setShowUserModal(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Folder Modal */}
      <Modal show={showFolderModal} onHide={() => { setShowFolderModal(false); setEditingItem(null); }}>
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>{editingItem ? 'Editar Carpeta' : 'Nueva Carpeta'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFolderSubmit}>
          <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text }}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control value={folderForm.nombre} onChange={(e) => setFolderForm({ ...folderForm, nombre: e.target.value })} required style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripcion</Form.Label>
              <Form.Control as="textarea" rows={3} value={folderForm.descripcion} onChange={(e) => setFolderForm({ ...folderForm, descripcion: e.target.value })} style={inputStyle} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
            <Button variant="secondary" onClick={() => { setShowFolderModal(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Prestamo Modal */}
      <Modal show={showPrestamoModal} onHide={() => { setShowPrestamoModal(false); setEditingItem(null); }}>
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>{editingItem ? 'Editar Prestamo' : 'Nuevo Prestamo'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePrestamoSubmit}>
          <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text }}>
            <Form.Group className="mb-3">
              <Form.Label><FiUser /> Usuario</Form.Label>
              <Form.Select value={prestamoForm.usuario} onChange={(e) => setPrestamoForm({ ...prestamoForm, usuario: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar usuario</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.nombre} ({u.email})</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label><FiBook /> Manual</Form.Label>
              <Form.Select value={prestamoForm.manual} onChange={(e) => setPrestamoForm({ ...prestamoForm, manual: e.target.value })} required style={inputStyle}>
                <option value="">Seleccionar manual</option>
                {manuales.map(m => <option key={m._id} value={m._id}>{m.titulo}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label><FiCalendar /> Fecha de Devolucion Esperada</Form.Label>
              <Form.Control type="date" value={prestamoForm.fecha_devolucion_esperada} onChange={(e) => setPrestamoForm({ ...prestamoForm, fecha_devolucion_esperada: e.target.value })} style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control as="textarea" rows={3} value={prestamoForm.observaciones} onChange={(e) => setPrestamoForm({ ...prestamoForm, observaciones: e.target.value })} placeholder="Notas sobre el prestamo..." style={inputStyle} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
            <Button variant="secondary" onClick={() => { setShowPrestamoModal(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Assign Users to Manual Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>Asignar Usuarios al Manual</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text, maxHeight: '400px', overflowY: 'auto' }}>
          {users.map(u => (
            <FormCheck
              key={u._id}
              type="checkbox"
              label={`${u.nombre} (${u.email})`}
              checked={selectedUsers.includes(u._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers([...selectedUsers, u._id]);
                } else {
                  setSelectedUsers(selectedUsers.filter(id => id !== u._id));
                }
              }}
              className="mb-2"
            />
          ))}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleAssignUsers}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Users to Folder Modal */}
      <Modal show={showFolderAssignModal} onHide={() => setShowFolderAssignModal(false)}>
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>Asignar Usuarios a Carpeta</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bgCard, color: colors.text, maxHeight: '400px', overflowY: 'auto' }}>
          {users.map(u => (
            <FormCheck
              key={u._id}
              type="checkbox"
              label={`${u.nombre} (${u.email})`}
              checked={selectedUsers.includes(u._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers([...selectedUsers, u._id]);
                } else {
                  setSelectedUsers(selectedUsers.filter(id => id !== u._id));
                }
              }}
              className="mb-2"
            />
          ))}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bgCard, borderTop: `1px solid ${colors.border}` }}>
          <Button variant="secondary" onClick={() => setShowFolderAssignModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleFolderAssignUsers}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>Vista Previa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '600px', backgroundColor: colors.bgCard }}>
          {previewUrl && <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} title="Preview" />}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminPanel;
