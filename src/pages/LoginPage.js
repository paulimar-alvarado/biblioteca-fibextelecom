import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { FiSun, FiMoon } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Inicio de sesion exitoso');
      setTimeout(() => {
        if (data.user.rol === 'admin') {
          navigate('/admin');
        } else {
          navigate('/mis-manuales');
        }
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark'
        ? 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)'
        : 'linear-gradient(135deg, #0b1d36 0%, #16324f 50%, #1e40af 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <Button
        onClick={toggleTheme}
        variant="outline-light"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {theme === 'dark' ? <FiSun /> : <FiMoon />}
      </Button>

      <Container className="d-flex justify-content-center">
        <Card style={{
          width: '420px',
          background: theme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${theme === 'dark' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.15)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                FB
              </div>
              <h3 style={{ color: 'white', fontWeight: '700', margin: 0 }}>Biblioteca Fibextelecom</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>Departamento de Sistemas</p>
            </div>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>Correo Electronico</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@fibextelecom.com"
                  required
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    padding: '10px 14px'
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>Contrasena</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  required
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    padding: '10px 14px'
                  }}
                />
              </Form.Group>
              <Button
                type="submit"
                className="w-100"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none',
                  padding: '10px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesion'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default LoginPage;
