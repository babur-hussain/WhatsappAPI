import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const CACHE_KEY_CONVERSATIONS = 'offline_conversations';

type FilterType = 'All' | 'Unread' | 'Favourites' | 'Groups';

export default function ConversationsScreen() {
    const [leads, setLeads] = useState<any[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const router = useRouter();
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();

    const fetchConversations = async () => {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY_CONVERSATIONS);
            if (cached) {
                const parsed = JSON.parse(cached);
                setLeads(parsed);
                setLoading(false);
            }

            const res = await apiClient.get('/conversations');
            if (res.data.success) {
                const freshData = res.data.data.conversations || [];
                setLeads(freshData);
                await AsyncStorage.setItem(CACHE_KEY_CONVERSATIONS, JSON.stringify(freshData));
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchConversations();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Live filtering logic
    useEffect(() => {
        let result = leads;

        // Apply Tab Filter
        if (activeFilter === 'Unread') {
            result = result.filter(l => l.unreadCount > 0);
        } else if (activeFilter === 'Favourites' || activeFilter === 'Groups') {
            result = []; // Live: No data yet for these filters
        }

        // Apply Search Filter
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(l => 
                (l.customerName && l.customerName.toLowerCase().includes(lowerQuery)) ||
                (l.customerPhone && l.customerPhone.includes(lowerQuery))
            );
        }

        setFilteredLeads(result);
    }, [searchQuery, leads, activeFilter]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-emerald-100', 'bg-blue-100', 'bg-purple-100', 
            'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'
        ];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const getTextAvatarColor = (name: string) => {
        const colors = [
            'text-emerald-700', 'text-blue-700', 'text-purple-700', 
            'text-amber-700', 'text-rose-700', 'text-cyan-700'
        ];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        } else if (diffDays < 2) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const name = item.customerName || item.customerPhone;
        const initial = name.charAt(0).toUpperCase();
        const avatarColor = getAvatarColor(name);
        const textColor = getTextAvatarColor(name);
        const time = formatTime(item.lastMessageTime);
        const unread = item.unreadCount > 0;

        return (
            <TouchableOpacity 
                className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-950 active:bg-slate-100 dark:active:bg-slate-900"
                activeOpacity={0.7}
                onPress={() => router.push(`/chat/${item.id}`)}
            >
                <View className={`w-[52px] h-[52px] rounded-full ${avatarColor} items-center justify-center mr-3`}>
                    <Text className={`${textColor} font-normal text-2xl`}>{initial}</Text>
                </View>
                
                <View className="flex-1 justify-center border-b border-slate-100 dark:border-slate-800/60 pb-3 pt-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-slate-900 dark:text-white font-semibold text-[17px]" numberOfLines={1}>
                            {name}
                        </Text>
                        <Text className={`${unread ? 'text-[#25D366]' : 'text-slate-500'} font-normal text-xs`}>
                            {time}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1 flex-row items-center mr-4">
                            {!unread && (item.lastMessageSender === 'ADMIN' || item.lastMessageSender === 'BOT') && (
                                <Ionicons 
                                    name={(!item.lastMessageStatus || item.lastMessageStatus === 'SENT') ? 'checkmark' : 'checkmark-done'} 
                                    size={16} 
                                    color={item.lastMessageStatus === 'READ' ? "#34B7F1" : "#8696A0"} 
                                    style={{ marginRight: 4 }} 
                                />
                            )}
                            <Text className={`${unread ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'} text-[15px]`} numberOfLines={1}>
                                {item.lastMessage || 'Tap to chat'}
                            </Text>
                        </View>
                        {unread && (
                            <View className="bg-[#25D366] rounded-full min-w-[20px] h-[20px] items-center justify-center px-1.5">
                                <Text className="text-white text-[11px] font-bold">{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const unreadTotal = leads.filter(l => l.unreadCount > 0).length;

    const FilterChip = ({ title, count, type }: { title: string, count?: number, type: FilterType }) => {
        const isActive = activeFilter === type;
        return (
            <TouchableOpacity 
                onPress={() => setActiveFilter(type)}
                className={`${isActive ? 'bg-[#E7FCE3] dark:bg-[#0A332C]' : 'bg-[#F3F4F6] dark:bg-[#202C33]'} px-4 py-1.5 rounded-full mr-2`}
            >
                <Text className={`${isActive ? 'text-[#138750] dark:text-[#25D366]' : 'text-[#54656F] dark:text-[#8696A0]'} font-medium`}>
                    {title}{count ? ` ${count}` : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View className="bg-white dark:bg-slate-950 pb-2">
            {/* Header row */}
            <View 
                className="px-4 pb-2 flex-row justify-between items-center bg-white dark:bg-slate-950"
                style={{ paddingTop: Math.max(insets.top, 16) }}
            >
                <Text className="text-[#25D366] font-bold text-2xl tracking-tight">WhatsApp</Text>
                {/* Icons removed per user request */}
            </View>

            {/* Search Bar */}
            <View className="px-4 py-2">
                <View className="bg-[#F3F4F6] dark:bg-[#1f2c34] flex-row items-center px-4 py-2.5 rounded-full">
                    <Text className="text-[#8696A0] text-2xl mr-2 -mt-1 font-light">⚲</Text>
                    <TextInput 
                        className="flex-1 text-[16px] text-slate-800 dark:text-slate-200"
                        placeholder="Ask Meta AI or Search"
                        placeholderTextColor="#8696A0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2 mb-2" contentContainerStyle={{ paddingRight: 20 }}>
                <FilterChip title="All" type="All" />
                <FilterChip title="Unread" type="Unread" count={unreadTotal > 0 ? unreadTotal : undefined} />
                <FilterChip title="Favourites" type="Favourites" />
                <FilterChip title="Groups" type="Groups" />
            </ScrollView>
        </View>
    );

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle="dark-content" />
            
            {loading && leads.length === 0 ? (
                <View className="flex-1 justify-center items-center bg-white dark:bg-slate-950">
                    <ActivityIndicator size="large" color="#25D366" />
                </View>
            ) : (
                <FlatList
                    data={filteredLeads}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={ListHeader}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25D366" />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center pt-20">
                            <Text className="text-slate-500 font-medium">No chats found</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity 
                className="absolute right-5 bg-[#25D366] w-14 h-14 rounded-2xl items-center justify-center shadow-md shadow-emerald-600/30 elevation-4"
                style={{ bottom: 20 }}
                onPress={() => router.push('/contacts')}
                activeOpacity={0.8}
            >
                <MaterialIcons name="chat" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}
