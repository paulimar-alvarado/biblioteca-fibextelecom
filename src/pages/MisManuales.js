import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { API_BASE_URL } from '../api';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import {
  FiDownload, FiEye, FiLogOut, FiSearch, FiFolder, FiBell, FiSun, FiMoon,
  FiFilter, FiCalendar, FiUser, FiStar, FiClock, FiArrowRight, FiRefreshCw,
  FiAlertTriangle, FiChevronDown, FiChevronUp, FiBook
} from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const MisManuales = () => {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [manuales, setManuales] = useState([]);
  const [folders, setFolders] = useState([]);
  const [descargas, setDescargas] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [activeSection, setActiveSection] = useState('manuales');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [manualesRes, foldersRes, descargasRes, prestamosRes, notifRes, unreadRes] = await Promise.all([
        api.get('/manuals'),
        api.get('/folders/mis-carpetas'),
        api.get('/downloads/mis-descargas'),
        api.get('/prestamos/mis-prestamos'),
        api.get('/notifications'),
        api.get('/notifications/unread')
      ]);
      setManuales(manualesRes.data);
      setFolders(foldersRes.data);
      setDescargas(descargasRes.data);
      setPrestamos(prestamosRes.data);
      setNotifications(notifRes.data);
      setUnreadCount(unreadRes.data.count || unreadRes.data.unread || 0);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error('Error al descargar');
    }
  };

  const handlePreview = (manual) => {
    const token = localStorage.getItem('token');
    setPreviewUrl(`${API_BASE_URL}/manuals/preview/${manual._id}?token=${token}`);
    setShowPreviewModal(true);
  };

  const handleReturnLoan = async (prestamoId) => {
    try {
      await api.put(`/prestamos/${prestamoId}/devolver`);
      toast.success('Préstamo devuelto correctamente');
      fetchData();
    } catch (error) {
      toast.error('Error al devolver préstamo');
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, leida: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error al marcar notificación');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Error al marcar notificaciones');
    }
  };

  const categories = ['Todas', ...new Set(manuales.map(m => m.categoria).filter(Boolean))];
  const priorityOptions = ['Todas', 'alta', 'media', 'baja'];
  const authors = [...new Set(manuales.map(m => m.autor).filter(Boolean))];

  const filteredManuales = manuales.filter(m => {
    const matchSearch =
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !categoryFilter || categoryFilter === 'Todas' || m.categoria === categoryFilter;
    const matchPriority = !priorityFilter || priorityFilter === 'Todas' || m.prioridad === priorityFilter;
    const matchAuthor = !authorFilter || authorFilter === 'Todos' || m.autor === authorFilter;

    let matchDateRange = true;
    if (dateFrom && m.fecha_vencimiento) {
      matchDateRange = matchDateRange && new Date(m.fecha_vencimiento) >= new Date(dateFrom);
    }
    if (dateTo && m.fecha_vencimiento) {
      matchDateRange = matchDateRange && new Date(m.fecha_vencimiento) <= new Date(dateTo);
    }

    return matchSearch && matchCategory && matchPriority && matchAuthor && matchDateRange;
  });

  const isExpired = (manual) => {
    if (!manual.fecha_vencimiento) return false;
    return new Date(manual.fecha_vencimiento) < new Date();
  };

  const isExpiringSoon = (manual) => {
    if (!manual.fecha_vencimiento) return false;
    const expiry = new Date(manual.fecha_vencimiento);
    const now = new Date();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  };

  const categoryColorMap = {
    'Manuales': '#0d6efd',
    'Instructivo': '#198754',
    'Politicas': '#ffc107',
    'Procedimientos': '#dc3545',
    'Capacitacion': '#0dcaf0'
  };

  const priorityColorMap = {
    'alta': '#dc3545',
    'media': '#ffc107',
    'baja': '#198754'
  };

  const priorityBadgeColor = (priority) => {
    switch (priority) {
      case 'alta': return { bg: '#dc3545', text: '#fff' };
      case 'media': return { bg: '#ffc107', text: '#000' };
      case 'baja': return { bg: '#198754', text: '#fff' };
      default: return { bg: colors.textMuted, text: '#fff' };
    }
  };

  const activePrestamos = prestamos.filter(p => p.estado === 'activo' || p.estado === 'pendiente');
  const completedPrestamos = prestamos.filter(p => p.estado === 'devuelto' || p.estado === 'completado');

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      transition: 'background 0.3s, color 0.3s'
    },
    header: {
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark || colors.primary}dd)`,
      padding: '14px 0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
    },
    headerTitle: {
      color: '#fff',
      fontSize: '1.25rem',
      fontWeight: 700,
      margin: 0
    },
    headerUser: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: '0.9rem'
    },
    card: {
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      transition: 'transform 0.2s, box-shadow 0.2s, background 0.3s',
      height: '100%'
    },
    cardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    },
    cardTitle: {
      color: colors.text,
      fontSize: '0.95rem',
      fontWeight: 600,
      margin: 0
    },
    cardDescription: {
      color: colors.textMuted,
      fontSize: '0.85rem'
    },
    cardFooter: {
      background: 'transparent',
      borderTop: `1px solid ${colors.border}`
    },
    badge: {
      fontSize: '0.75rem',
      fontWeight: 500,
      borderRadius: '20px',
      padding: '3px 10px'
    },
    categoryBadge: (cat) => ({
      background: categoryColorMap[cat] || colors.textMuted,
      color: '#fff',
      fontSize: '0.72rem',
      fontWeight: 600,
      borderRadius: '20px',
      padding: '2px 8px'
    }),
    searchInput: {
      background: colors.bgCard,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '10px 14px 10px 40px',
      fontSize: '0.9rem',
      width: '100%'
    },
    filterSection: {
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px'
    },
    categoryChip: (active) => ({
      background: active ? (categoryColorMap[categoryFilter] || colors.primary) : colors.bgCard,
      color: active ? '#fff' : colors.text,
      border: `1px solid ${active ? (categoryColorMap[categoryFilter] || colors.primary) : colors.border}`,
      borderRadius: '20px',
      padding: '5px 14px',
      fontSize: '0.8rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    inputField: {
      background: colors.bgCard,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '0.85rem',
      width: '100%'
    },
    sectionTab: (active) => ({
      background: active ? colors.primary : 'transparent',
      color: active ? '#fff' : colors.textMuted,
      border: `1px solid ${active ? colors.primary : colors.border}`,
      borderRadius: '20px',
      padding: '6px 16px',
      fontSize: '0.82rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    folderCard: {
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${colors.primary}`,
      borderRadius: '12px',
      padding: '16px'
    },
    downloadItem: {
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      padding: '12px 16px',
      marginBottom: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    prestamoCard: (estado) => ({
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${estado === 'activo' || estado === 'pendiente' ? '#198754' : '#6c757d'}`,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px'
    }),
    btnPrimary: {
      background: colors.primary,
      border: 'none',
      borderRadius: '8px',
      padding: '6px 14px',
      fontSize: '0.82rem',
      fontWeight: 500,
      color: '#fff',
      cursor: 'pointer'
    },
    btnOutline: (hover) => ({
      background: hover ? colors.primary : 'transparent',
      color: hover ? '#fff' : colors.primary,
      border: `1px solid ${colors.primary}`,
      borderRadius: '8px',
      padding: '6px 14px',
      fontSize: '0.82rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    notificationDropdown: {
      position: 'absolute',
      top: '50px',
      right: 0,
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      width: '360px',
      maxHeight: '420px',
      overflowY: 'auto',
      zIndex: 1050
    },
    notificationItem: (leida) => ({
      background: leida ? 'transparent' : `${colors.primary}11`,
      borderBottom: `1px solid ${colors.border}`,
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }),
    footer: {
      background: colors.bgCard,
      borderTop: `1px solid ${colors.border}`,
      padding: '14px 0',
      marginTop: '40px'
    },
    viewsCount: {
      color: colors.textMuted,
      fontSize: '0.78rem',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  };

  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [btnHoverLogout, setBtnHoverLogout] = useState(false);
  const [btnHoverTheme, setBtnHoverTheme] = useState(false);

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={3000} theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* Header */}
      <div style={styles.header}>
        <Container fluid className="d-flex justify-content-between align-items-center px-4">
          <div className="d-flex align-items-center gap-2">
            <FiBook size={22} color="#fff" />
            <h4 style={styles.headerTitle}>Mis Manuales</h4>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span style={styles.headerUser}>{user?.nombre}</span>

            <button
              onClick={toggleTheme}
              onMouseEnter={() => setBtnHoverTheme(true)}
              onMouseLeave={() => setBtnHoverTheme(false)}
              style={{
                ...styles.btnOutline(btnHoverTheme),
                background: btnHoverTheme ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.4)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#dc3545',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 1040 }}
                    onClick={() => setShowNotifications(false)}
                  />
                  <div style={styles.notificationDropdown}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: colors.text, fontSize: '0.95rem' }}>Notificaciones</strong>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Marcar todo leido
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '0.85rem' }}>
                        Sin notificaciones
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((notif) => (
                        <div
                          key={notif._id}
                          style={styles.notificationItem(notif.leida)}
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <div style={{ fontSize: '0.85rem', color: colors.text, fontWeight: notif.leida ? 400 : 600 }}>
                            {notif.mensaje || notif.titulo || notif.message}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '4px' }}>
                            {formatDate(notif.fecha || notif.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              onMouseEnter={() => setBtnHoverLogout(true)}
              onMouseLeave={() => setBtnHoverLogout(false)}
              style={{
                ...(btnHoverLogout && { background: 'rgba(255,255,255,0.2)' }),
                borderRadius: '8px'
              }}
            >
              <FiLogOut /> Cerrar Sesion
            </Button>
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {/* Section Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button style={styles.sectionTab(activeSection === 'manuales')} onClick={() => setActiveSection('manuales')}>
            <FiBook size={14} style={{ marginRight: 6 }} /> Mis Manuales ({filteredManuales.length})
          </button>
          <button style={styles.sectionTab(activeSection === 'carpetas')} onClick={() => setActiveSection('carpetas')}>
            <FiFolder size={14} style={{ marginRight: 6 }} /> Mis Carpetas ({folders.length})
          </button>
          <button style={styles.sectionTab(activeSection === 'descargas')} onClick={() => setActiveSection('descargas')}>
            <FiDownload size={14} style={{ marginRight: 6 }} /> Mis Descargas ({descargas.length})
          </button>
          <button style={styles.sectionTab(activeSection === 'prestamos')} onClick={() => setActiveSection('prestamos')}>
            <FiClock size={14} style={{ marginRight: 6 }} /> Mis Prestamos ({prestamos.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: colors.primary }} />
          </div>
        ) : (
          <>
            {/* === MANUALES SECTION === */}
            {activeSection === 'manuales' && (
              <>
                {/* Search & Filters */}
                <div style={styles.filterSection}>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{ position: 'relative', flex: 1 }}>
                      <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                      <input
                        type="text"
                        placeholder="Buscar manuales por titulo o descripcion..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                      />
                    </div>
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      style={{
                        background: showAdvancedFilters ? colors.primary : colors.bgCard,
                        color: showAdvancedFilters ? '#fff' : colors.text,
                        border: `1px solid ${showAdvancedFilters ? colors.primary : colors.border}`,
                        borderRadius: '8px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        transition: 'all 0.2s'
                      }}
                    >
                      <FiFilter /> Filtros {showAdvancedFilters ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>

                  {/* Category Badges */}
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    {categories.map(cat => (
                      <span
                        key={cat}
                        style={styles.categoryChip(categoryFilter === cat || (!categoryFilter && cat === 'Todas'))}
                        onClick={() => setCategoryFilter(cat === 'Todas' ? '' : cat)}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '14px' }}>
                      <Row>
                        <Col md={3} className="mb-2">
                          <label style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px', display: 'block' }}>
                            <FiStar size={12} /> Prioridad
                          </label>
                          <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            style={styles.inputField}
                          >
                            {priorityOptions.map(p => (
                              <option key={p} value={p === 'Todas' ? '' : p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </option>
                            ))}
                          </select>
                        </Col>
                        <Col md={3} className="mb-2">
                          <label style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px', display: 'block' }}>
                            <FiUser size={12} /> Autor
                          </label>
                          <select
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                            style={styles.inputField}
                          >
                            <option value="">Todos</option>
                            {authors.map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </Col>
                        <Col md={3} className="mb-2">
                          <label style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px', display: 'block' }}>
                            <FiCalendar size={12} /> Fecha desde
                          </label>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={styles.inputField}
                          />
                        </Col>
                        <Col md={3} className="mb-2">
                          <label style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '4px', display: 'block' }}>
                            <FiCalendar size={12} /> Fecha hasta
                          </label>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={styles.inputField}
                          />
                        </Col>
                      </Row>
                      <div className="text-end mt-2">
                        <button
                          onClick={() => {
                            setPriorityFilter('');
                            setAuthorFilter('');
                            setDateFrom('');
                            setDateTo('');
                            setCategoryFilter('');
                            setSearchTerm('');
                          }}
                          style={{
                            background: 'none',
                            border: `1px solid ${colors.border}`,
                            color: colors.textMuted,
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Manuals Grid */}
                {filteredManuales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                    <FiBook size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem' }}>No se encontraron manuales</p>
                  </div>
                ) : (
                  <Row>
                    {filteredManuales.map(manual => {
                      const expired = isExpired(manual);
                      const expiringSoon = isExpiringSoon(manual);
                      const pColor = priorityBadgeColor(manual.prioridad);

                      return (
                        <Col lg={4} md={6} key={manual._id} className="mb-4">
                          <div
                            style={{
                              ...styles.card,
                              ...(hoveredCard === manual._id ? styles.cardHover : {}),
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                            onMouseEnter={() => setHoveredCard(manual._id)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            <div style={{ padding: '18px 18px 12px', flex: 1 }}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 style={styles.cardTitle}>{manual.titulo}</h6>
                              </div>

                              <div className="d-flex gap-2 flex-wrap mb-2">
                                {manual.categoria && (
                                  <span style={styles.categoryBadge(manual.categoria)}>
                                    {manual.categoria}
                                  </span>
                                )}
                                {manual.prioridad && (
                                  <span style={{
                                    background: pColor.bg,
                                    color: pColor.text,
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    padding: '2px 8px'
                                  }}>
                                    {manual.prioridad.toUpperCase()}
                                  </span>
                                )}
                                {expired && (
                                  <span style={{
                                    background: '#dc3545',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '20px',
                    padding: '2px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    <FiAlertTriangle size={10} /> VENCIDO
                  </span>
                                )}
                                {expiringSoon && !expired && (
                                  <span style={{
                                    background: '#ffc107',
                                    color: '#000',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    padding: '2px 8px'
                                  }}>
                                    Vence pronto
                                  </span>
                                )}
                                {manual.version && (
                                  <span style={{
                                    background: `${colors.primary}22`,
                                    color: colors.primary,
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    padding: '2px 8px'
                                  }}>
                                    v{manual.version}
                                  </span>
                                )}
                              </div>

                              <p style={styles.cardDescription} className="mb-2">
                                {manual.descripcion?.length > 120
                                  ? manual.descripcion.substring(0, 120) + '...'
                                  : manual.descripcion}
                              </p>

                              <div style={{ fontSize: '0.78rem', color: colors.textMuted, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {manual.autor && (
                                  <div className="d-flex align-items-center gap-1">
                                    <FiUser size={12} /> {manual.autor}
                                  </div>
                                )}
                                {manual.vistas != null && (
                                  <div style={styles.viewsCount}>
                                    <FiEye size={12} /> {manual.vistas} vistas
                                  </div>
                                )}
                                {manual.fecha_vencimiento && (
                                  <div className="d-flex align-items-center gap-1">
                                    <FiCalendar size={12} /> Vence: {formatDate(manual.fecha_vencimiento)}
                                  </div>
                                )}
                                {manual.folder_id && (
                                  <div className="d-flex align-items-center gap-1">
                                    <FiFolder size={12} /> {manual.folder_id.nombre}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ ...styles.cardFooter, padding: '12px 18px' }}>
                              <div className="d-flex gap-2">
                                {manual.archivo && (
                                  <>
                                    <button
                                      style={{
                                        ...styles.btnOutline(hoveredBtn === `dl-${manual._id}`),
                                        flex: 1
                                      }}
                                      onMouseEnter={() => setHoveredBtn(`dl-${manual._id}`)}
                                      onMouseLeave={() => setHoveredBtn(null)}
                                      onClick={() => handleDownload(manual)}
                                    >
                                      <FiDownload /> Descargar
                                    </button>
                                    <button
                                      style={{
                                        ...styles.btnOutline(hoveredBtn === `pv-${manual._id}`),
                                        flex: 1
                                      }}
                                      onMouseEnter={() => setHoveredBtn(`pv-${manual._id}`)}
                                      onMouseLeave={() => setHoveredBtn(null)}
                                      onClick={() => handlePreview(manual)}
                                    >
                                      <FiEye /> Ver
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </>
            )}

            {/* === CARPETAS SECTION === */}
            {activeSection === 'carpetas' && (
              <>
                {folders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                    <FiFolder size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem' }}>No tienes carpetas asignadas</p>
                  </div>
                ) : (
                  <Row>
                    {folders.map(folder => (
                      <Col lg={3} md={4} sm={6} key={folder._id} className="mb-3">
                        <div style={styles.folderCard}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FiFolder style={{ color: colors.primary }} />
                            <strong style={{ color: colors.text, fontSize: '0.95rem' }}>{folder.nombre}</strong>
                          </div>
                          <p style={{ color: colors.textMuted, fontSize: '0.83rem', marginBottom: '8px' }}>
                            {folder.descripcion}
                          </p>
                          <Badge style={{ background: `${colors.primary}22`, color: colors.primary, borderRadius: '16px', fontSize: '0.75rem' }}>
                            {folder.manuales?.length || 0} manuales
                          </Badge>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}

            {/* === DESCARGAS SECTION === */}
            {activeSection === 'descargas' && (
              <>
                {descargas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                    <FiDownload size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem' }}>No tienes descargas registradas</p>
                  </div>
                ) : (
                  <div>
                    {descargas.map((desc, idx) => (
                      <div key={desc._id || idx} style={styles.downloadItem}>
                        <div>
                          <div style={{ color: colors.text, fontWeight: 500, fontSize: '0.9rem' }}>
                            {desc.manual?.titulo || desc.titulo || 'Manual'}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: '0.78rem', marginTop: '2px' }}>
                            <FiCalendar size={12} style={{ marginRight: 4 }} />
                            {formatDate(desc.fecha || desc.createdAt)}
                            {desc.categoria && (
                              <span style={{
                                marginLeft: '10px',
                                background: categoryColorMap[desc.categoria] || colors.textMuted,
                                color: '#fff',
                                padding: '1px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem'
                              }}>
                                {desc.categoria}
                              </span>
                            )}
                          </div>
                        </div>
                        {desc.manual && (
                          <FiDownload
                            size={18}
                            style={{ color: colors.primary, cursor: 'pointer' }}
                            onClick={() => handleDownload(desc.manual)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* === PRESTAMOS SECTION === */}
            {activeSection === 'prestamos' && (
              <>
                {prestamos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
                    <FiClock size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ fontSize: '1rem' }}>No tienes prestamos registrados</p>
                  </div>
                ) : (
                  <>
                    {activePrestamos.length > 0 && (
                      <div className="mb-4">
                        <h6 style={{ color: colors.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#198754', display: 'inline-block' }} />
                          Activos ({activePrestamos.length})
                        </h6>
                        {activePrestamos.map((p) => (
                          <div key={p._id} style={styles.prestamoCard(p.estado)}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong style={{ color: colors.text, fontSize: '0.95rem' }}>
                                  {p.manual?.titulo || p.titulo || 'Manual'}
                                </strong>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '4px' }}>
                                  <span style={{
                                    background: p.estado === 'activo' ? '#198754' : '#ffc107',
                                    color: p.estado === 'activo' ? '#fff' : '#000',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600
                                  }}>
                                    {p.estado?.charAt(0).toUpperCase() + p.estado?.slice(1)}
                                  </span>
                                  <span style={{ marginLeft: '10px' }}>
                                    <FiCalendar size={12} style={{ marginRight: 4 }} />
                                    Prestado: {formatDate(p.fecha_prestamo || p.createdAt)}
                                  </span>
                                  {p.fecha_devolucion_esperada && (
                                    <span style={{ marginLeft: '10px' }}>
                                      | Vence: {formatDate(p.fecha_devolucion_esperada)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleReturnLoan(p._id)}
                                style={{
                                  background: colors.primary,
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '6px 14px',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <FiRefreshCw size={12} /> Devolver
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {completedPrestamos.length > 0 && (
                      <div>
                        <h6 style={{ color: colors.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6c757d', display: 'inline-block' }} />
                          Devueltos ({completedPrestamos.length})
                        </h6>
                        {completedPrestamos.map((p) => (
                          <div key={p._id} style={styles.prestamoCard(p.estado)}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong style={{ color: colors.text, fontSize: '0.95rem' }}>
                                  {p.manual?.titulo || p.titulo || 'Manual'}
                                </strong>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '4px' }}>
                                  <span style={{
                                    background: '#6c757d',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600
                                  }}>
                                    Devuelto
                                  </span>
                                  <span style={{ marginLeft: '10px' }}>
                                    Prestado: {formatDate(p.fecha_prestamo || p.createdAt)}
                                  </span>
                                  {p.fecha_devolucion && (
                                    <span style={{ marginLeft: '10px' }}>
                                      | Devuelto: {formatDate(p.fecha_devolucion)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Footer */}
      <div style={styles.footer}>
        <Container>
          <p className="text-center" style={{ margin: 0, color: colors.textMuted, fontSize: '0.82rem' }}>
            Elaborado por Paulimar - Fibextelecom {new Date().getFullYear()}
          </p>
        </Container>
      </div>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: colors.bgCard, borderBottom: `1px solid ${colors.border}` }}>
          <Modal.Title style={{ color: colors.text }}>Vista Previa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '600px', background: colors.bgCard, padding: 0 }}>
          {previewUrl && (
            <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} title="Preview" />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MisManuales;
