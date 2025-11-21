import { ForumTopic, ForumComment, User } from '../types';
import { DB, getStorage, setStorage, delay } from './db';
import { CONFIG } from './config';

// Mock data fallback
const MOCK_TOPICS: ForumTopic[] = [
  {
    id: 'TOPIC-001',
    authorId: 'system',
    authorName: 'MotoVibe Admin',
    title: 'MotoVibe Topluluğuna Hoş Geldiniz!',
    content: 'Merhaba arkadaşlar...',
    category: 'Genel',
    date: new Date().toLocaleDateString('tr-TR'),
    likes: 42,
    views: 1250,
    comments: [],
    tags: ['Duyuru']
  }
];

export const forumService = {
  async getTopics(): Promise<ForumTopic[]> {
    if (CONFIG.USE_MOCK_API) {
        await delay(500);
        const topics = getStorage<ForumTopic[]>(DB.FORUM_TOPICS, []);
        if (topics.length === 0) {
            setStorage(DB.FORUM_TOPICS, MOCK_TOPICS);
            return MOCK_TOPICS;
        }
        return topics;
    } else {
        // REAL BACKEND
        try {
            const response = await fetch(`${CONFIG.API_URL}/forum/topics`);
            if (!response.ok) return MOCK_TOPICS;
            return await response.json();
        } catch {
            return MOCK_TOPICS;
        }
    }
  },

  async createTopic(user: User, title: string, content: string, category: ForumTopic['category'], tags: string[]): Promise<ForumTopic> {
    const newTopic: ForumTopic = {
      id: `TOPIC-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      title,
      content,
      category,
      date: new Date().toLocaleDateString('tr-TR'),
      likes: 0,
      views: 0,
      comments: [],
      tags
    };

    if (CONFIG.USE_MOCK_API) {
        await delay(800);
        const topics = getStorage<ForumTopic[]>(DB.FORUM_TOPICS, []);
        topics.unshift(newTopic);
        setStorage(DB.FORUM_TOPICS, topics);
        return newTopic;
    } else {
        // REAL BACKEND
        const response = await fetch(`${CONFIG.API_URL}/forum/topics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTopic)
        });
        return await response.json();
    }
  },

  async addComment(topicId: string, user: User, content: string): Promise<ForumComment> {
    const newComment: ForumComment = {
      id: `CMT-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      content,
      date: new Date().toLocaleDateString('tr-TR'),
      likes: 0
    };

    if (CONFIG.USE_MOCK_API) {
        await delay(500);
        const topics = getStorage<ForumTopic[]>(DB.FORUM_TOPICS, []);
        const topicIndex = topics.findIndex(t => t.id === topicId);
        if (topicIndex === -1) throw new Error('Konu bulunamadı');
        topics[topicIndex].comments.push(newComment);
        setStorage(DB.FORUM_TOPICS, topics);
        return newComment;
    } else {
        // REAL BACKEND
        const response = await fetch(`${CONFIG.API_URL}/forum/topics/${topicId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComment)
        });
        return await response.json();
    }
  },

  async toggleLike(topicId: string): Promise<void> {
    if (CONFIG.USE_MOCK_API) {
        const topics = getStorage<ForumTopic[]>(DB.FORUM_TOPICS, []);
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
            topic.likes += 1;
            setStorage(DB.FORUM_TOPICS, topics);
        }
    } else {
        // REAL BACKEND
        await fetch(`${CONFIG.API_URL}/forum/topics/${topicId}/like`, {
            method: 'POST'
        });
    }
  }
};