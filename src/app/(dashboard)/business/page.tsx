'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { businessService, Business, BusinessProfile, BusinessType, BrandTone, CreateBusinessData, strategicPlanService, StrategicPlan } from '@/lib/api';
import {
    Building2, MapPin, Phone, Mail, Globe, Briefcase,
    BarChart3, Target, Palette, Edit, Star, Calendar,
    Users, Megaphone, FileText, Sparkles, Eye, Type,
    Instagram, Facebook, Linkedin, MessageCircle, Send,
    X, Check, Link2
} from 'lucide-react';

/**
 * Business Page - Modern Profile-Style Layout
 * 
 * Redesigned with:
 * - Header with gradient and profile
 * - Stats cards with icons
 * - Vertical scroll layout (no tabs)
 * - Brand Identity section
 */

// =============================================
// Types & Constants
// =============================================

const businessTypes: { value: BusinessType; label: string; icon: React.ReactNode }[] = [
    { value: 'BAKERY', label: 'Padaria / Pastelaria', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'RESTAURANT', label: 'Restaurante / Café', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'SALON', label: 'Salão de Beleza', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'GROCERY', label: 'Mercearia / Supermercado', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'CLINIC', label: 'Clínica / Saúde', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'SCHOOL', label: 'Escola / Ensino', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'TECHNOLOGY', label: 'Tecnologia', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'SERVICES', label: 'Serviços', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'RETAIL', label: 'Comércio / Retalho', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'CONSULTING', label: 'Consultoria', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'OTHER', label: 'Outro', icon: <Briefcase className="w-4 h-4" /> },
];

const brandTones: { value: BrandTone; label: string; icon: React.ReactNode }[] = [
    { value: 'PROFESSIONAL', label: 'Profissional', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'FRIENDLY', label: 'Amigável', icon: <Users className="w-4 h-4" /> },
    { value: 'HUMOROUS', label: 'Humorístico', icon: <Sparkles className="w-4 h-4" /> },
    { value: 'MODERN', label: 'Moderno', icon: <Target className="w-4 h-4" /> },
    { value: 'ELEGANT', label: 'Elegante', icon: <Star className="w-4 h-4" /> },
    { value: 'CASUAL', label: 'Casual', icon: <MessageCircle className="w-4 h-4" /> },
];

const channelIcons: Record<string, React.ReactNode> = {
    'Instagram': <Instagram className="w-4 h-4" />,
    'Facebook': <Facebook className="w-4 h-4" />,
    'TikTok': <Megaphone className="w-4 h-4" />,
    'LinkedIn': <Linkedin className="w-4 h-4" />,
    'WhatsApp': <MessageCircle className="w-4 h-4" />,
    'Email': <Mail className="w-4 h-4" />,
    'SMS': <Send className="w-4 h-4" />,
    'Website': <Globe className="w-4 h-4" />,
};

const channels = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'WhatsApp', 'Email', 'SMS', 'Website'];

// =============================================
// Sub-Components
// =============================================

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
}

function StatCard({ icon, label, value, color = 'primary' }: StatCardProps) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        amber: 'bg-amber-100 text-amber-600',
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

interface ColorSwatchProps {
    color: string;
}

function ColorSwatch({ color }: ColorSwatchProps) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className="w-16 h-16 rounded-xl shadow-md border border-gray-100"
                style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-500 font-mono">{color}</span>
        </div>
    );
}

// =============================================
// Main Component
// =============================================

export default function BusinessPage() {
    const { user } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [strategicPlan, setStrategicPlan] = useState<StrategicPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState<CreateBusinessData>({
        name: '',
        business_type: 'OTHER',
        description: '',
        city: '',
        country: 'Moçambique',
        address: '',
        slogan: '',
        phone: '',
        email: '',
        website: '',
        brand_tone: 'PROFESSIONAL',
        preferred_channels: [],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load business list first to get the ID
            const bizResponse = await businessService.getAll();
            if (bizResponse.success && bizResponse.data && bizResponse.data.length > 0) {
                const biz = bizResponse.data[0];
                setBusiness(biz);
                setFormData({
                    name: biz.name,
                    business_type: biz.business_type,
                    description: biz.description || '',
                    city: biz.city,
                    country: biz.country,
                    address: biz.address || '',
                    slogan: biz.slogan || '',
                    phone: biz.phone || '',
                    email: biz.email || '',
                    website: biz.website || '',
                    brand_tone: biz.brand_tone || 'PROFESSIONAL',
                    preferred_channels: biz.preferred_channels || [],
                });

                // Now load the full profile with stats, visual identity, etc.
                try {
                    const profileResponse = await businessService.getProfile(biz._id);
                    if (profileResponse.success && profileResponse.data) {
                        setProfile(profileResponse.data);
                    }
                } catch (profileErr) {
                    console.error('Failed to load profile:', profileErr);
                }
            } else {
                setIsEditing(true);
            }

            // Load strategic plan for brand identity (fallback)
            try {
                const planResponse = await strategicPlanService.list();
                if (planResponse.success && planResponse.data && planResponse.data.length > 0) {
                    setStrategicPlan(planResponse.data[0]);
                }
            } catch (err) {
                // Strategic plan might not exist, that's ok
                console.log('No strategic plan found');
            }
        } catch (err: any) {
            console.error('Failed to load data:', err);
            // If no business exists, show create form
            setIsEditing(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            if (business) {
                const response = await businessService.update(business._id, formData);
                if (response.success && response.data) {
                    setBusiness(response.data);
                    setSuccess('Negócio actualizado com sucesso!');
                    setIsEditing(false);
                    // Reload full profile to get updated stats
                    loadData();
                } else {
                    setError(response.message || 'Erro ao actualizar');
                }
            } else {
                const response = await businessService.create(formData);
                if (response.success && response.data) {
                    setBusiness(response.data);
                    setSuccess('Negócio criado com sucesso!');
                    setIsEditing(false);
                    // Load profile for new business
                    loadData();
                } else {
                    setError(response.message || 'Erro ao criar');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleChannel = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            preferred_channels: prev.preferred_channels?.includes(channel)
                ? prev.preferred_channels.filter(c => c !== channel)
                : [...(prev.preferred_channels || []), channel]
        }));
    };

    // Get brand identity data from profile visual identity or strategic plan
    const brandIdentity = {
        colorPalette: profile?.visualIdentity?.colors ? [
            profile.visualIdentity.colors.primary,
            profile.visualIdentity.colors.secondary,
            profile.visualIdentity.colors.accent,
            profile.visualIdentity.colors.background,
            profile.visualIdentity.colors.text,
        ].filter(Boolean) as string[] : (strategicPlan?.content?.colorPalette || strategicPlan?.colorPalette || []),
        typography: profile?.visualIdentity?.typography || null,
        brandTone: strategicPlan?.content?.brandTone || strategicPlan?.brandTone || business?.brand_tone,
        values: strategicPlan?.content?.values || strategicPlan?.values || [],
        mission: strategicPlan?.content?.mission || strategicPlan?.mission,
        vision: strategicPlan?.content?.vision || strategicPlan?.vision,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500">A carregar...</p>
                </div>
            </div>
        );
    }

    // Edit/Create Form
    if (isEditing) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {business ? 'Editar Negócio' : 'Criar Negócio'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {business ? 'Actualize as informações do seu negócio' : 'Configure o seu negócio para começar'}
                        </p>
                    </div>
                    {business && (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Messages */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Basic Info Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Informações Básicas
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Negócio *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Ex: Café Central"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Negócio *
                                </label>
                                <select
                                    value={formData.business_type}
                                    onChange={e => setFormData({ ...formData, business_type: e.target.value as BusinessType })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {businessTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slogan
                                </label>
                                <input
                                    type="text"
                                    value={formData.slogan}
                                    onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Ex: O melhor café da cidade"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Descreva o seu negócio..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Localização
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cidade *
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Ex: Maputo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    País *
                                </label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Endereço
                                </label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Ex: Av. Eduardo Mondlane, 123"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-primary" />
                            Contactos
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="+258 84 xxx xxxx"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="email@negocio.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Brand Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            Identidade da Marca
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tom da Marca
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {brandTones.map(tone => (
                                    <button
                                        key={tone.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, brand_tone: tone.value })}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${formData.brand_tone === tone.value
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tone.icon}
                                        {tone.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Canais Preferidos
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {channels.map(channel => (
                                    <button
                                        key={channel}
                                        type="button"
                                        onClick={() => toggleChannel(channel)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${formData.preferred_channels?.includes(channel)
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {channelIcons[channel]}
                                        {channel}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
                        {business && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    {business ? 'Guardar Alterações' : 'Criar Negócio'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // View Mode - Clean Layout (No gradient banner)
    return (
        <>
            {/* Messages */}
            {success && (
                <div className="p-4 bg-green-50 border-b border-green-200 text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white">
                {/* Header Section - Clean layout */}
                <div className="p-6 border-b border-gray-100">
                    {/* Top row: Edit button on right */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>

                    {/* Logo */}
                    <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                        {(profile?.logo?.url || business?.logo_url) ? (
                            <img
                                src={profile?.logo?.url || business?.logo_url}
                                alt={business?.name || 'Logo'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Convert Drive link to direct image link if needed
                                    const target = e.target as HTMLImageElement;
                                    const url = target.src;
                                    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                    if (driveMatch && driveMatch[1]) {
                                        target.src = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
                                    }
                                }}
                            />
                        ) : (
                            <Building2 className="w-8 h-8 text-white" />
                        )}
                    </div>

                    {/* Name & Location */}
                    <h1 className="text-2xl font-bold text-gray-900">{business?.name}</h1>
                    <p className="text-gray-500 text-sm mt-1">{business?.city}, {business?.country}</p>

                    {/* Description */}
                    <p className="text-gray-600 mt-3 leading-relaxed">
                        {business?.description || 'Nenhuma descrição adicionada.'}
                    </p>

                    {/* Social/Channel Icons */}
                    {business?.preferred_channels && business.preferred_channels.length > 0 && (
                        <div className="flex items-center gap-2 mt-4">
                            {business.preferred_channels.map(channel => (
                                <div
                                    key={channel}
                                    className="w-9 h-9 bg-gray-100 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                                    title={channel}
                                >
                                    {channelIcons[channel]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats Cards Row */}
                <div className="p-6 border-b border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Megaphone className="w-5 h-5" />}
                            label="Campanhas"
                            value={profile?.stats?.campaignsCount ?? 0}
                            color="primary"
                        />
                        <StatCard
                            icon={<BarChart3 className="w-5 h-5" />}
                            label="Pesquisas"
                            value={profile?.stats?.researchCount ?? 0}
                            color="blue"
                        />
                        <StatCard
                            icon={<FileText className="w-5 h-5" />}
                            label="Plano Estratégico"
                            value={profile?.stats?.hasStrategicPlan ? "Sim" : "Não"}
                            color="green"
                        />
                        <StatCard
                            icon={<Star className="w-5 h-5" />}
                            label="Tom da Marca"
                            value={brandTones.find(t => t.value === business?.brand_tone)?.label || '-'}
                            color="amber"
                        />
                    </div>
                </div>

                {/* About Section - Complete business info */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sobre</h3>

                    {/* Slogan - if exists */}
                    {business?.slogan && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border-l-4 border-primary">
                            <p className="text-gray-600 italic">&quot;{business.slogan}&quot;</p>
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Business Type */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tipo de Negócio</p>
                                <p className="text-gray-800 font-medium">
                                    {businessTypes.find(t => t.value === business?.business_type)?.label || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Creation Date */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Criado em</p>
                                <p className="text-gray-800 font-medium">
                                    {business?.created_at ? new Date(business.created_at).toLocaleDateString('pt-MZ') : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Address */}
                        {business?.address && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Endereço</p>
                                    <p className="text-gray-800 font-medium">{business.address}</p>
                                </div>
                            </div>
                        )}

                        {/* Phone */}
                        {business?.phone && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Telefone</p>
                                    <a href={`tel:${business.phone}`} className="text-gray-800 font-medium hover:text-primary transition-colors">
                                        {business.phone}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {business?.email && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <a href={`mailto:${business.email}`} className="text-gray-800 font-medium hover:text-primary transition-colors">
                                        {business.email}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Website */}
                        {business?.website && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Globe className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Website</p>
                                    <a
                                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-800 font-medium hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        {business.website}
                                        <Link2 className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Brand Identity Section */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Identidade da Marca
                    </h3>

                    {/* Color Palette */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Paleta de Cores</h4>
                        {brandIdentity.colorPalette.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {brandIdentity.colorPalette.map((color, idx) => (
                                    <ColorSwatch key={idx} color={color} />
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-xl text-center">
                                <Palette className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Nenhuma paleta de cores definida.</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Gere um Plano Estratégico para obter sugestões de cores.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Brand Tone */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Tom da Marca</h4>
                        <div className="p-4 bg-gray-50 rounded-xl inline-flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                {brandTones.find(t => t.value === business?.brand_tone)?.icon || <Star className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                                <p className="text-gray-800 font-medium">
                                    {brandTones.find(t => t.value === business?.brand_tone)?.label || 'Não definido'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Brand Values */}
                    {brandIdentity.values.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Valores da Marca</h4>
                            <div className="flex flex-wrap gap-2">
                                {brandIdentity.values.map((value, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                                    >
                                        {value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mission & Vision */}
                    {(brandIdentity.mission || brandIdentity.vision) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {brandIdentity.mission && (
                                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10">
                                    <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Missão
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{brandIdentity.mission}</p>
                                </div>
                            )}
                            {brandIdentity.vision && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                    <h4 className="text-sm font-medium text-purple-600 mb-2 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Visão
                                    </h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{brandIdentity.vision}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Contact Section */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" />
                        Informações de Contacto
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {business?.phone && (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Telefone</p>
                                    <p className="text-gray-800 font-medium">{business.phone}</p>
                                </div>
                            </div>
                        )}

                        {business?.email && (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-gray-800 font-medium">{business.email}</p>
                                </div>
                            </div>
                        )}

                        {business?.website && (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    <p className="text-gray-800 font-medium">{business.website}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Localização</p>
                                <p className="text-gray-800 font-medium">{business?.city}, {business?.country}</p>
                            </div>
                        </div>
                    </div>

                    {!business?.phone && !business?.email && !business?.website && (
                        <div className="p-6 bg-gray-50 rounded-xl text-center mt-4">
                            <Phone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Nenhum contacto adicionado.</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-2 text-primary font-medium hover:underline text-sm"
                            >
                                Adicionar contactos
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
