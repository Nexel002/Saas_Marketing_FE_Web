'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { businessService, Business, BusinessType, BrandTone, CreateBusinessData } from '@/lib/api';

/**
 * Business Page
 * 
 * Configure and manage business information.
 */

const businessTypes: { value: BusinessType; label: string }[] = [
    { value: 'BAKERY', label: 'Padaria / Pastelaria' },
    { value: 'RESTAURANT', label: 'Restaurante / Café' },
    { value: 'SALON', label: 'Salão de Beleza' },
    { value: 'GROCERY', label: 'Mercearia / Supermercado' },
    { value: 'CLINIC', label: 'Clínica / Saúde' },
    { value: 'SCHOOL', label: 'Escola / Ensino' },
    { value: 'TECHNOLOGY', label: 'Tecnologia' },
    { value: 'SERVICES', label: 'Serviços' },
    { value: 'RETAIL', label: 'Comércio / Retalho' },
    { value: 'CONSULTING', label: 'Consultoria' },
    { value: 'OTHER', label: 'Outro' },
];

const brandTones: { value: BrandTone; label: string; emoji: string }[] = [
    { value: 'PROFESSIONAL', label: 'Profissional', emoji: '💼' },
    { value: 'FRIENDLY', label: 'Amigável', emoji: '😊' },
    { value: 'HUMOROUS', label: 'Humorístico', emoji: '😄' },
    { value: 'MODERN', label: 'Moderno', emoji: '🚀' },
    { value: 'ELEGANT', label: 'Elegante', emoji: '✨' },
    { value: 'CASUAL', label: 'Casual', emoji: '👋' },
];

const channels = [
    'Instagram',
    'Facebook',
    'TikTok',
    'LinkedIn',
    'WhatsApp',
    'Email',
    'SMS',
    'Website',
];

export default function BusinessPage() {
    const { user } = useAuth();
    const [business, setBusiness] = useState<Business | null>(null);
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
        slogan: '',
        phone: '',
        email: '',
        website: '',
        brand_tone: 'PROFESSIONAL',
        preferred_channels: [],
    });

    useEffect(() => {
        loadBusiness();
    }, []);

    const loadBusiness = async () => {
        setIsLoading(true);
        try {
            const response = await businessService.getAll();
            if (response.success && response.data && response.data.length > 0) {
                const biz = response.data[0];
                setBusiness(biz);
                setFormData({
                    name: biz.name,
                    business_type: biz.business_type,
                    description: biz.description || '',
                    city: biz.city,
                    country: biz.country,
                    slogan: biz.slogan || '',
                    phone: biz.phone || '',
                    email: biz.email || '',
                    website: biz.website || '',
                    brand_tone: biz.brand_tone || 'PROFESSIONAL',
                    preferred_channels: biz.preferred_channels || [],
                });
            } else {
                setIsEditing(true); // Open form if no business
            }
        } catch (err) {
            console.error('Failed to load business:', err);
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
                // Update
                const response = await businessService.update(business._id, formData);
                if (response.success && response.data) {
                    setBusiness(response.data);
                    setSuccess('Negócio actualizado com sucesso!');
                    setIsEditing(false);
                } else {
                    setError(response.message || 'Erro ao actualizar');
                }
            } else {
                // Create
                const response = await businessService.create(formData);
                if (response.success && response.data) {
                    setBusiness(response.data);
                    setSuccess('Negócio criado com sucesso!');
                    setIsEditing(false);
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Meu Negócio</h1>
                    <p className="text-gray-500 mt-1">
                        Configure as informações do seu negócio
                    </p>
                </div>

                {business && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-primary bg-primary/10 rounded-lg font-medium hover:bg-primary/20 transition-colors"
                    >
                        ✏️ Editar
                    </button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
                    {success}
                </div>
            )}

            {/* View Mode */}
            {business && !isEditing ? (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Business Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                        {business.logo_url ? (
                            <img
                                src={business.logo_url}
                                alt={business.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
                                🏢
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {business.name}
                            </h2>
                            {business.slogan && (
                                <p className="text-gray-500 italic">"{business.slogan}"</p>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        {business.description && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Descrição</h4>
                                <p className="text-gray-800">{business.description}</p>
                            </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Tipo</h4>
                                <p className="text-gray-800">
                                    {businessTypes.find(t => t.value === business.business_type)?.label}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Localização</h4>
                                <p className="text-gray-800">{business.city}, {business.country}</p>
                            </div>
                            {business.phone && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Telefone</h4>
                                    <p className="text-gray-800">{business.phone}</p>
                                </div>
                            )}
                            {business.email && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                                    <p className="text-gray-800">{business.email}</p>
                                </div>
                            )}
                        </div>

                        {business.brand_tone && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Tom da Marca</h4>
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                    {brandTones.find(t => t.value === business.brand_tone)?.emoji}
                                    {brandTones.find(t => t.value === business.brand_tone)?.label}
                                </span>
                            </div>
                        )}

                        {business.preferred_channels && business.preferred_channels.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Canais Preferidos</h4>
                                <div className="flex flex-wrap gap-2">
                                    {business.preferred_channels.map(channel => (
                                        <span
                                            key={channel}
                                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                        >
                                            {channel}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Edit/Create Form */
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    {/* Basic Info */}
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

                    {/* Location */}
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
                    </div>

                    {/* Contact */}
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

                    {/* Brand Tone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tom da Marca
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {brandTones.map(tone => (
                                <button
                                    key={tone.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, brand_tone: tone.value })}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${formData.brand_tone === tone.value
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {tone.emoji} {tone.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Channels */}
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
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${formData.preferred_channels?.includes(channel)
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {channel}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        {business && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    💾 {business ? 'Guardar Alterações' : 'Criar Negócio'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
