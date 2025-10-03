import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
            console.error('Login failed:', err);
        }
    };

    return (
        <div data-testid="login-page">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        id="username"
                        data-testid="username-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        aria-label="Username"
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        data-testid="password-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Password"
                    />
                </div>
                {error && <p data-testid="error-message" style={{ color: 'red' }}>{error}</p>}
                <button data-testid="login-button" type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
