'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Trash2, ExternalLink, Plus } from 'lucide-react';

interface Catalog {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: 'PDF' | 'IMAGE';
    createdAt: string;
}

export default function CatalogsPage() {
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const apiUrl = 'https://whatsappapi.lfvs.in/api/v1/catalog';
    const getHeaders = () => {
        const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/)?.[1] || '' : '';
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const fetchCatalogs = async () => {
        try {
            const res = await fetch(apiUrl, {
                headers: getHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setCatalogs(data.data?.catalogs || []);
            }
        } catch (e) {
            console.log('Failed to fetch catalogs', e);
        }
    };

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            setError('File size must be less than 20MB');
            return;
        }

        setIsUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': getHeaders().Authorization,
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            await fetchCatalogs();
        } catch (err: any) {
            setError(err.message || 'Error uploading file');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this catalog?')) return;

        try {
            await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            fetchCatalogs();
        } catch (e) {
            console.log('Failed to delete catalog');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catalogs</h1>
                    <p className="text-slate-500 mt-2">Manage and upload product catalogs to send to your WhatsApp leads.</p>
                </div>

                <div className="relative group">
                    <input
                        type="file"
                        id="catalog-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <button
                        className={`flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 font-medium ${isUploading ? 'opacity-70' : ''}`}
                    >
                        {isUploading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        <span>{isUploading ? 'Uploading...' : 'Upload Catalog'}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center">
                    <div className="font-medium">{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catalogs.length === 0 ? (
                    <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No catalogs yet</h3>
                        <p className="max-w-sm text-center">Upload your first PDF or Image catalog so we can automatically send it to your new WhatsApp leads.</p>
                    </div>
                ) : (
                    catalogs.map((catalog) => (
                        <div
                            key={catalog.id}
                            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                        {catalog.fileType === 'PDF' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(catalog.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete catalog"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="font-semibold text-slate-900 line-clamp-2" title={catalog.fileName}>
                                    {catalog.fileName}
                                </h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Uploaded on {new Date(catalog.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 mt-auto border-t border-slate-100">
                                <a
                                    href={catalog.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Catalog
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
