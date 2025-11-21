import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Eye, Plus, User, Hash, Calendar, ArrowLeft, Send, Lock, TrendingUp, Search, ShieldAlert, Filter } from 'lucide-react';
import { ForumTopic, User as UserType } from '../types';
import { Button } from './Button';
import { forumService } from '../services/forumService';

interface ForumProps {
  user: UserType | null;
  onOpenAuth: () => void;
}

export const Forum: React.FC<ForumProps> = ({ user, onOpenAuth }) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumTopic['category']>('Genel');
  
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setIsLoading(true);
    try {
      const data = await forumService.getTopics();
      setTopics(data);
    } catch (error) {
      console.error("Forum yüklenemedi", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Rest of the logic remains same as previous improved version) ...
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await forumService.createTopic(user, newTitle, newContent, newCategory, ['Yeni']);
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
      loadTopics();
    } catch (error) {
      console.error("Konu açılamadı", error);
    }
  };

  const handleTopicClick = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setView('detail');
    window.scrollTo(0,0);
  };

  const handleAddComment = async () => {
    if (!user || !selectedTopic || !commentText.trim()) return;
    try {
      const newComment = await forumService.addComment(selectedTopic.id, user, commentText);
      const updatedTopic = { ...selectedTopic, comments: [...selectedTopic.comments, newComment] };
      setSelectedTopic(updatedTopic);
      setCommentText('');
      const updatedTopics = topics.map(t => t.id === selectedTopic.id ? updatedTopic : t);
      setTopics(updatedTopics);
    } catch (error) {
      console.error("Yorum yapılamadı", error);
    }
  };

  const handleLike = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    await forumService.toggleLike(topicId);
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, likes: t.likes + 1 } : t));
    if (selectedTopic && selectedTopic.id === topicId) {
      setSelectedTopic(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  };

  const renderTopicList = () => {
      const filteredTopics = topics.filter(t => {
          const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.content.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
          return matchesSearch && matchesCategory;
      });

      return (
        <div className="animate-in fade-in duration-500">
          {/* Hero Section */}
          <div className="relative rounded-3xl bg-gradient-to-r from-gray-900 to-black border border-white/10 p-8 md:p-12 mb-12 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-moto-accent/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                      <div className="flex items-center gap-2 text-moto-accent mb-3 font-bold tracking-widest text-xs uppercase">
                          <TrendingUp className="w-4 h-4" />
                          <span>Topluluk Merkezi</span>
                      </div>
                      <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-none">
                          MOTO<span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-red-600">FORUM</span>
                      </h1>
                      <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
                          Deneyimlerini paylaş, rotalar keşfet, teknik destek al ve diğer sürücülerle bağlantı kur.
                      </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {user ? (
                        <Button 
                            variant="primary" 
                            size="lg" 
                            onClick={() => setIsCreating(!isCreating)} 
                            className={`shadow-[0_0_30px_rgba(255,31,31,0.3)] transition-all duration-300 ${isCreating ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white shadow-none' : ''}`}
                        >
                            {isCreating ? <><ArrowLeft className="w-4 h-4 mr-2"/> VAZGEÇ</> : <><Plus className="w-4 h-4 mr-2"/> KONU BAŞLAT</>}
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={onOpenAuth} className="border-moto-accent text-moto-accent hover:bg-moto-accent hover:text-white">
                            <User className="w-4 h-4 mr-2" /> GİRİŞ YAP VE KATIL
                        </Button>
                    )}
                  </div>
              </div>
          </div>

          {/* Create Topic Form */}
          {isCreating && user && (
              <div className="mb-12 bg-[#0a0a0a] border border-moto-accent/30 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-500 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-moto-accent"></div>
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 font-display">
                      <div className="p-2 bg-moto-accent/20 rounded-lg border border-moto-accent/30">
                        <Plus className="w-5 h-5 text-moto-accent" />
                      </div>
                      Yeni Konu Oluştur
                  </h3>
                  <form onSubmit={handleCreateTopic} className="space-y-6">
                      {/* ... Form Inputs (same as before) ... */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-2">
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Başlık</label>
                              <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-moto-accent outline-none" placeholder="Başlık..." />
                          </div>
                          <div className="space-y-2">
                              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</label>
                              <select className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-moto-accent outline-none" value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)}>{['Genel', 'Teknik', 'Gezi', 'Ekipman', 'Etkinlik'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">İçerik</label>
                          <textarea required value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-moto-accent outline-none min-h-[150px]" placeholder="İçerik..." />
                      </div>
                      <div className="flex justify-end pt-4 border-t border-white/5"><Button type="submit" variant="cyber">YAYINLA</Button></div>
                  </form>
              </div>
          )}

          {/* Filters */}
          <div className="sticky top-24 z-30 bg-[#050505]/80 backdrop-blur-xl py-4 border-b border-white/5 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:static sm:border-none">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0a0a] border border-white/10 p-2 rounded-2xl">
                  <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
                      {['ALL', 'Genel', 'Teknik', 'Gezi', 'Ekipman', 'Etkinlik'].map(cat => (
                          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat ? 'bg-moto-accent text-white shadow-lg shadow-moto-accent/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                              {cat === 'ALL' ? 'TÜMÜ' : cat.toUpperCase()}
                          </button>
                      ))}
                  </div>
                  <div className="relative w-full md:w-72 px-2 md:px-0">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="text" placeholder="Konu ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:border-moto-accent outline-none" />
                  </div>
              </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-moto-accent border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                  <div className="text-center py-32 bg-[#0a0a0a] border border-white/5 rounded-3xl border-dashed"><p className="text-gray-500">Aradığınız kriterlere uygun konu yok.</p></div>
              ) : (
                  filteredTopics.map((topic) => (
                    <div key={topic.id} onClick={() => handleTopicClick(topic)} className="group bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl hover:border-moto-accent/40 transition-all cursor-pointer relative overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-6 md:items-center">
                          <div className="flex md:flex-col items-center gap-4 md:gap-2 text-gray-500 text-xs md:border-r md:border-white/5 md:pr-6 md:w-24 flex-shrink-0 md:justify-center">
                              <div className="flex flex-col items-center"><span className="text-lg font-bold text-white group-hover:text-moto-accent">{topic.likes}</span><span>Beğeni</span></div>
                              <div className="flex flex-col items-center"><span className="text-lg font-bold text-gray-300">{topic.comments.length}</span><span>Yorum</span></div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border bg-gray-800 text-gray-400 border-gray-700">{topic.category}</span>
                                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1"><Calendar className="w-3 h-3" /> {topic.date}</span>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-moto-accent line-clamp-1">{topic.title}</h3>
                              <p className="text-gray-400 text-sm line-clamp-2 mb-4">{topic.content}</p>
                              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                  <div className="flex items-center gap-2.5">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-black ${topic.authorId.includes('admin') ? 'bg-gradient-to-br from-moto-accent to-red-900' : 'bg-gray-700'}`}>{topic.authorName.charAt(0)}</div>
                                      <span className={`text-xs font-medium ${topic.authorId.includes('admin') ? 'text-moto-accent' : 'text-gray-300'}`}>{topic.authorName}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500"><Eye className="w-3 h-3" /> {topic.views}</div>
                              </div>
                          </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      );
  };

  const renderDetail = () => {
    if (!selectedTopic) return null;
    return (
      <div className="animate-in slide-in-from-right duration-500 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setView('list')} className="mb-8 pl-0 hover:text-moto-accent text-gray-400"><ArrowLeft className="w-4 h-4 mr-2" /> FORUMA DÖN</Button>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden mb-12">
          <div className="p-8 md:p-12 border-b border-white/5 bg-gradient-to-b from-white/5 via-[#0f0f0f] to-[#0a0a0a]">
            <div className="flex flex-wrap items-center gap-3 mb-6"><span className="px-3 py-1 bg-moto-accent text-white text-xs font-bold uppercase rounded">{selectedTopic.category}</span></div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-8">{selectedTopic.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/10 ${selectedTopic.authorId.includes('admin') ? 'bg-gradient-to-br from-moto-accent to-red-900' : 'bg-gray-700'}`}>{selectedTopic.authorName.charAt(0)}</div>
                  <div>
                      <div className="flex items-center gap-2"><span className={`font-bold ${selectedTopic.authorId.includes('admin') ? 'text-moto-accent' : 'text-white'}`}>{selectedTopic.authorName}</span>{selectedTopic.authorId.includes('admin') && <span className="text-[10px] bg-moto-accent/20 text-moto-accent px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>}</div>
                      <div className="text-xs text-gray-500 mt-1">{selectedTopic.date}</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                   <button onClick={(e) => handleLike(e, selectedTopic.id)} className="bg-moto-accent/10 border border-moto-accent/20 hover:bg-moto-accent hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 text-moto-accent text-xs font-bold transition-all"><Heart className="w-4 h-4" /> {selectedTopic.likes} Beğeni</button>
               </div>
            </div>
          </div>
          <div className="p-8 md:p-12 text-gray-300 leading-loose text-lg min-h-[200px] font-light border-b border-white/5 whitespace-pre-wrap">{selectedTopic.content}</div>
          
          {/* Comments */}
          <div className="p-8 bg-[#050505]">
             <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3"><MessageSquare className="w-5 h-5 text-moto-accent"/> Yorumlar ({selectedTopic.comments.length})</h3>
             <div className="space-y-8 mb-12">
                {selectedTopic.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 md:gap-6">
                     <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold mt-1 border border-white/10 ${comment.authorId.includes('admin') ? 'bg-moto-accent' : 'bg-gray-800'}`}>{comment.authorName.charAt(0)}</div>
                     <div className="flex-1 bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl rounded-tl-none relative shadow-lg">
                        <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-3">
                           <div className="flex items-center gap-2"><span className={`font-bold text-sm ${comment.authorId.includes('admin') ? 'text-moto-accent' : 'text-white'}`}>{comment.authorName}</span></div>
                           <span className="text-[10px] text-gray-600 font-mono">{comment.date}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                     </div>
                  </div>
                ))}
             </div>
             {/* Comment Form */}
             {user ? (
               <div className="sticky bottom-6 z-30">
                   <div className="relative flex gap-4 items-start bg-[#111] border border-white/15 p-4 md:p-6 rounded-2xl shadow-2xl ring-1 ring-white/5">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center text-white font-bold border border-white/10">{user.name.charAt(0)}</div>
                      <div className="flex-1 relative">
                         <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Bu konuya katkıda bulun..." className="w-full bg-black border border-white/10 rounded-xl p-4 pr-16 text-white focus:outline-none focus:border-moto-accent min-h-[60px] resize-none" />
                         <button onClick={handleAddComment} disabled={!commentText.trim()} className="absolute bottom-3 right-3 p-2 bg-moto-accent text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all"><Send className="w-4 h-4" /></button>
                      </div>
                   </div>
               </div>
             ) : (
               <div className="bg-gradient-to-r from-[#0f0f0f] to-black border border-white/10 p-8 rounded-2xl text-center"><Lock className="w-8 h-8 text-gray-500 mx-auto mb-4" /><h4 className="text-white font-bold mb-2">Tartışmaya Katıl</h4><p className="text-gray-400 text-sm mb-6">Yorum yapmak için giriş yapmalısın.</p><Button variant="outline" onClick={onOpenAuth}>GİRİŞ YAP</Button></div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      {view === 'list' && renderTopicList()}
      {view === 'detail' && renderDetail()}
    </div>
  );
};