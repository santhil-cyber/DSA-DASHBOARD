import React, { useState } from 'react';
import { MotivationItem } from '../types';
import { Trash2, Plus, Image as ImageIcon, Video, X, Youtube, Upload } from 'lucide-react';

interface MotivationProps {
    items: MotivationItem[];
    onAdd: (item: MotivationItem) => void;
    onDelete: (id: string) => void;
}

const Motivation: React.FC<MotivationProps> = ({ items, onAdd, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const [captionInput, setCaptionInput] = useState('');
    const [fileError, setFileError] = useState('');

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError('');
        
        if (file) {
            // Updated limit to 15MB as requested
            if (file.size > 15 * 1024 * 1024) { 
                setFileError('File size too large. Max 15MB for storage performance.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const type = file.type.startsWith('video') ? 'video' : 'image';
                
                onAdd({
                    id: generateId(),
                    type,
                    content: base64String,
                    caption: captionInput || (type === 'video' ? 'Motivation Video' : 'Motivation'),
                    addedDate: new Date().toISOString()
                });
                resetForm();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return;

        let type: 'video' | 'youtube' = 'video';
        let content = urlInput;

        // Simple YouTube Detection
        if (urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) {
            type = 'youtube';
            // Extract ID logic (simple)
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = urlInput.match(regExp);
            if (match && match[2].length === 11) {
                content = match[2];
            } else if (urlInput.includes('shorts')) {
                const parts = urlInput.split('/shorts/');
                if (parts[1]) content = parts[1].split('?')[0];
            }
        }

        onAdd({
            id: generateId(),
            type,
            content,
            caption: captionInput || 'Motivation Video',
            addedDate: new Date().toISOString()
        });
        resetForm();
    };

    const resetForm = () => {
        setUrlInput('');
        setCaptionInput('');
        setFileError('');
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="text-3xl">🚀</span> Motivation Station
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 mt-1">Keep your spirits high. 9:16 aspect ratio recommended.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all"
                >
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>

            {items.length === 0 ? (
                <div className="bg-white dark:bg-lc-card border border-slate-200 dark:border-lc-border rounded-2xl p-12 text-center border-dashed">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">Nothing here yet</h3>
                    <p className="text-slate-500 dark:text-gray-500 max-w-md mx-auto mt-2">
                        Upload motivational quotes, images, or link your favorite YouTube Shorts to stay disciplined.
                    </p>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="mt-6 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                        Add your first item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="group relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md">
                            {/* Delete Overlay */}
                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onDelete(item.id)}
                                    className="bg-black/50 hover:bg-rose-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {item.type === 'image' && (
                                <img src={item.content} alt="Motivation" className="w-full h-full object-cover" />
                            )}

                            {item.type === 'video' && (
                                <video 
                                    src={item.content} 
                                    controls 
                                    className="w-full h-full object-cover" 
                                    playsInline
                                />
                            )}

                            {item.type === 'youtube' && (
                                <iframe 
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${item.content}?playsinline=1&rel=0`}
                                    title="YouTube video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            )}

                            {/* Caption Overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                                <p className="text-white text-sm font-medium truncate">{item.caption}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-lc-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex border-b border-slate-100 dark:border-lc-border">
                            <button 
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-500 dark:text-gray-400'}`}
                            >
                                <Upload className="w-4 h-4" /> Upload File
                            </button>
                            <button 
                                onClick={() => setActiveTab('url')}
                                className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'url' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-500 dark:text-gray-400'}`}
                            >
                                <Video className="w-4 h-4" /> Video URL
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Caption</label>
                                <input 
                                    type="text" 
                                    placeholder="Keep pushing..." 
                                    value={captionInput}
                                    onChange={(e) => setCaptionInput(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-lc-border rounded-lg bg-white dark:bg-lc-bg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {activeTab === 'upload' ? (
                                <div>
                                    <div className="border-2 border-dashed border-slate-200 dark:border-lc-border rounded-xl p-8 text-center bg-slate-50 dark:bg-lc-hover cursor-pointer relative hover:border-indigo-400 transition-colors">
                                        <input 
                                            type="file" 
                                            accept="image/*,video/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">Click to select Image or Video</p>
                                        <p className="text-xs text-slate-400 mt-1">Max 15MB</p>
                                    </div>
                                    {fileError && <p className="text-xs text-rose-500 mt-2">{fileError}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Video / YouTube URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="https://youtube.com/shorts/..." 
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-200 dark:border-lc-border rounded-lg bg-white dark:bg-lc-bg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button 
                                            onClick={handleUrlSubmit}
                                            disabled={!urlInput}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                        <Youtube className="w-3 h-3" /> Supports YouTube Shorts & MP4 links
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-lc-hover border-t border-slate-100 dark:border-lc-border flex justify-end">
                            <button 
                                onClick={resetForm}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 px-4 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Motivation;