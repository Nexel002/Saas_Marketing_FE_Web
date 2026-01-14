'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Eye,
    Trash2,
    Filter,
    BarChart3,
    Target,
    Megaphone
} from 'lucide-react';
import {
    researchService,
    strategicPlanService,
    campaignService,
    MarketResearch,
    StrategicPlan,
    Campaign
} from '@/lib/api';

// Unified Document Type
interface DocumentItem {
    id: string;
    name: string;
    type: 'RESEARCH' | 'STRATEGY' | 'CAMPAIGN';
    date: string;
    pdfUrl?: string; // For the Eye icon action
    originalData: MarketResearch | StrategicPlan | Campaign;
}

type FilterType = 'ALL' | 'RESEARCH' | 'STRATEGY' | 'CAMPAIGN';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch all data in parallel
            const [researchRes, strategyRes, campaignsRes] = await Promise.all([
                researchService.list(),
                strategicPlanService.list(),
                campaignService.list()
            ]);

            const newDocs: DocumentItem[] = [];

            // Process Research
            if (researchRes.success && researchRes.data) {
                researchRes.data.forEach(item => {
                    newDocs.push({
                        id: item._id,
                        name: 'Estudo de Mercado', // Research usually doesn't have a name field, using generic
                        type: 'RESEARCH',
                        date: item.created_at,
                        pdfUrl: item.pdf_url,
                        originalData: item
                    });
                });
            }

            // Process Strategy
            if (strategyRes.success && strategyRes.data) {
                strategyRes.data.forEach(item => {
                    newDocs.push({
                        id: item._id,
                        name: 'Plano Estratégico',
                        type: 'STRATEGY',
                        date: item.created_at,
                        pdfUrl: item.pdf_url,
                        originalData: item
                    });
                });
            }

            // Process Campaigns
            if (campaignsRes.success && campaignsRes.data) {
                campaignsRes.data.forEach(item => {
                    newDocs.push({
                        id: item._id,
                        name: item.name,
                        type: 'CAMPAIGN',
                        date: item.created_at,
                        pdfUrl: item.pdf_url,
                        originalData: item
                    });
                });
            }

            // Sort by date desc
            newDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setDocuments(newDocs);

        } catch (error) {
            console.error('Failed to load documents', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (doc: DocumentItem) => {
        if (!confirm('Tem certeza que deseja apagar este documento? Esta ação não pode ser desfeita.')) return;

        setIsDeleting(doc.id);
        try {
            let success = false;
            if (doc.type === 'RESEARCH') {
                const res = await researchService.delete(doc.id);
                success = res.success;
            } else if (doc.type === 'STRATEGY') {
                const res = await strategicPlanService.delete(doc.id);
                success = res.success;
            } else if (doc.type === 'CAMPAIGN') {
                const res = await campaignService.delete(doc.id);
                success = res.success;
            }

            if (success || true) { // Optimistic update or if API returns void/success
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
            }
        } catch (error) {
            console.error('Failed to delete document', error);
            alert('Erro ao apagar documento.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleViewPdf = (url?: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            alert('PDF não disponível para este documento.');
        }
    };

    // Filter logic
    const filteredDocs = documents.filter(doc => {
        // Text Search
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        // Type Filter
        const matchesType = activeFilter === 'ALL' || doc.type === activeFilter;

        return matchesSearch && matchesType;
    });

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const getTypeLabel = (type: DocumentItem['type']) => {
        switch (type) {
            case 'RESEARCH': return 'Estudo de Mercado';
            case 'STRATEGY': return 'Plano Estratégico';
            case 'CAMPAIGN': return 'Campanha';
            default: return type;
        }
    };

    const getTypeIcon = (type: DocumentItem['type']) => {
        switch (type) {
            case 'RESEARCH': return <BarChart3 className="w-5 h-5 text-blue-500" />;
            case 'STRATEGY': return <FileText className="w-5 h-5 text-green-500" />;
            case 'CAMPAIGN': return <Megaphone className="w-5 h-5 text-purple-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Documentos</h1>
                <p className="text-gray-500 mt-1">
                    Todos os seus estudos, planos e relatórios num só lugar
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto max-w-full">
                    {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'RESEARCH', label: 'Estudos' },
                        { id: 'STRATEGY', label: 'Planos' },
                        { id: 'CAMPAIGN', label: 'Campanhas' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as FilterType)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeFilter === tab.id
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar documentos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Documento</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data de Criação</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500">
                                        Nenhum documento encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {getTypeIcon(doc.type)}
                                                </div>
                                                <span className="font-medium text-gray-800">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${doc.type === 'RESEARCH' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    doc.type === 'STRATEGY' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        'bg-purple-50 text-purple-700 border-purple-100'
                                                }`}>
                                                {getTypeLabel(doc.type)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500">
                                            {formatDate(doc.date)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewPdf(doc.pdfUrl)}
                                                    className={`p-2 rounded-lg transition-colors ${doc.pdfUrl
                                                            ? 'text-gray-400 hover:text-primary hover:bg-primary/5 cursor-pointer'
                                                            : 'text-gray-300 cursor-not-allowed'
                                                        }`}
                                                    title={doc.pdfUrl ? "Ver PDF" : "PDF indisponível"}
                                                    disabled={!doc.pdfUrl}
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc)}
                                                    disabled={isDeleting === doc.id}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    {isDeleting === doc.id ? (
                                                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
