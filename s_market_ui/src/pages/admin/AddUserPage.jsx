import React, { useState } from 'react';
import { Upload, ChevronDown, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser, registerVendor } from '../../api/api';
import AdminNavbar from '../../components/AdminNavbar';
import './AddUserPage.css';

const AddUserPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        status: true, // Active by default
        avatar: null
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleToggleStatus = () => {
        setFormData(prev => ({
            ...prev,
            status: !prev.status
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";

        // Phone validation: 10 digits
        const phoneRegex = /^\d{10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = "Phone number must be exactly 10 digits";
        }

        if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        if (!formData.role) newErrors.role = "Role selection is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submit button clicked");
        console.log("Current Form Data:", formData);

        const isValid = validate();
        console.log("Validation Result:", isValid);
        console.log("Current Errors:", errors); // Note: this might show old errors as state update is async, so we depend on isValid result

        if (isValid) {
            console.log("Form is valid, attempting to register...");
            const loadingToast = toast.loading('Creating user...');
            try {
                // Map role names to IDs: 1: Admin, 2: Customer (Default), 3: Vendor, 4: Moderator
                let roleId = 2; // Default to 'Customer'
                if (formData.role === 'Admin') roleId = 1;
                else if (formData.role === 'Vendor') roleId = 3;
                else if (formData.role === 'Moderator') roleId = 4;

                const payload = {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    roleId: roleId,
                    status: formData.status ? 'Active' : 'Inactive'
                };

                let data;
                if (formData.role === 'Vendor') {
                    // vendor API path handles role assignment explicitly
                    data = await registerVendor(payload);
                } else {
                    data = await registerUser(payload);
                }

                toast.dismiss(loadingToast);
                console.log("User created:", data);

                toast.success("User created successfully!");
                navigate('/admin/dashboard');
            } catch (error) {
                toast.dismiss(loadingToast);
                console.error("Creation failed:", error);

                const errorMessage = error.message || "Failed to create user";
                if (errorMessage.includes("Email already in use") || errorMessage.includes("Email already in use by another vendor")) {
                    setErrors(prev => ({ ...prev, email: errorMessage }));
                } else if (errorMessage.includes("Phone number already in use") || errorMessage.includes("Phone number already in use by another vendor")) {
                    setErrors(prev => ({ ...prev, phone: errorMessage }));
                } else {
                    toast.error(errorMessage);
                }
            }
        }
    };

    return (
        <div className="add-user-page">
            <AdminNavbar title="Add New User" />

            <main className="add-user-content">
                <div className="page-header">
                    <button className="btn-back" onClick={() => navigate('/admin/dashboard')} aria-label="Go back">
                        <ArrowLeft size={20} color="#1e293b" />
                    </button>
                    <h2>Add New User</h2>
                </div>

                <form onSubmit={handleSubmit} className="add-user-form">
                    {/* General Information Section */}
                    <div className="form-section">
                        <h3>General Information</h3>

                        <div className="form-group full-width">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="e.g. Jonathan Doe"
                                value={formData.fullName}
                                onChange={handleInputChange}
                            />
                            {errors.fullName && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.fullName}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="j.doe@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                                {errors.email && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                                {errors.phone && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                {errors.password && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.password}</span>}
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                                {errors.confirmPassword && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.confirmPassword}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Role & Access Section */}
                    <div className="form-section">
                        <h3>Role & Access</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Select Role</label>
                                <div className="select-wrapper">
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className={!formData.role ? 'placeholder-selected' : ''}
                                    >
                                        <option value="" disabled>Choose a role...</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Moderator">Moderator</option>
                                        <option value="Vendor">Vendor</option>
                                    </select>
                                    <ChevronDown size={16} className="select-icon" />
                                </div>
                                {errors.role && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.role}</span>}
                            </div>

                            <div className="form-group status-group">
                                <div className="status-label">
                                    <label>Account Status</label>
                                    <span className="status-helper">Allow user to login and perform actions</span>
                                </div>
                                <label className="switch-large">
                                    <input
                                        type="checkbox"
                                        checked={formData.status}
                                        onChange={handleToggleStatus}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Profile Photo Section */}
                    <div className="form-section">
                        <h3>Profile Photo</h3>

                        <div className="photo-upload-container">
                            <div className="current-photo-placeholder">
                                <User size={40} color="#cbd5e1" />
                            </div>

                            <div className="upload-area">
                                <div className="upload-content">
                                    <div className="upload-icon-circle">
                                        <Upload size={20} color="white" />
                                    </div>
                                    <h4>Click to upload or drag and drop</h4>
                                    <p>SVG, PNG, JPG or GIF (max. 800x800px)</p>
                                    <input type="file" className="file-input-hidden" accept="image/*" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/dashboard')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-create">
                            Create User
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default AddUserPage;
