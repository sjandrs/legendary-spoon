import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const { t } = useTranslation();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (_err) {
            setError(t('validation.invalid_credentials'));
            console.error('Login failed:', _err);
        }
    };

    return (
        <div data-testid="login-page">
            <h2>{t('auth.login')}</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">{t('auth.username')}:</label>
                    <input
                        id="username"
                        data-testid="username-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label={t('auth.username')}
                    />
                </div>
                <div>
                    <label htmlFor="password">{t('auth.password')}:</label>
                    <input
                        id="password"
                        data-testid="password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label={t('auth.password')}
                    />
                </div>
                {error && <p data-testid="error-message" style={{ color: 'red' }}>{error}</p>}
                <button data-testid="login-button" type="submit">{t('auth.login')}</button>
            </form>
        </div>
    );
};

export default Login;
