import React, { useState } from 'react';
import { Eye, EyeOff, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginWholesaler } from '../api/api';

const WholesalerLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Signing in...');
        try {
            const data = await loginWholesaler(email, password);

            if (data.status && data.status.toLowerCase() === 'pending') {
                toast.dismiss(loadingToast);
                toast.error('Your wholesaler account is pending approval. Please wait for admin to approve your application.');
                return;
            }

            localStorage.setItem('user', JSON.stringify(data));
            window.dispatchEvent(new Event('storage'));
            toast.dismiss(loadingToast);
            toast.success(`Welcome back, ${data.fullName}!`);
            navigate('/wholesaler/dashboard', { replace: true });
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.message || 'Login failed');
        }
    };

    return (
        <div className="login-page">
            <div className="login-content">
                <div className="login-container">
                    <Link to="/" className="home-button">
                        <Home size={20} /><span>Home</span>
                    </Link>
                    <div className="login-header">
                        <h2>Wholesaler Login</h2>
                        <p>Sign in to your wholesale account</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <Input id="email" label="Email Address" type="email" placeholder="business@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <div className="form-group">
                            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>Password</label>
                            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={showPassword ? EyeOff : Eye} onIconClick={() => setShowPassword(!showPassword)} required />
                        </div>
                        <Button type="submit" fullWidth>Sign in</Button>
                    </form>
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/wholesaler/register" style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>Register here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesalerLoginPage;
