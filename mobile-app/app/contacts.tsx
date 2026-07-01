import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import apiClient from '../api/client';

export default function ContactsScreen() {
    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                    sort: Contacts.SortTypes.FirstName,
                });

                // Filter out contacts without a phone number
                const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
                setContacts(validContacts);
            } else {
                Alert.alert('Permission required', 'We need access to your contacts to start new chats.');
            }
            setLoading(false);
        })();
    }, []);

    const startChat = async (contact: Contacts.Contact) => {
        if (startingChat) return;
        
        const phone = contact.phoneNumbers?.[0]?.number;
        const name = contact.name || contact.firstName || 'Unknown';
        
        if (!phone) {
            Alert.alert('Invalid Contact', 'This contact does not have a valid phone number.');
            return;
        }

        setStartingChat(true);
        try {
            const res = await apiClient.post('/conversations/initiate', {
                customerPhone: phone,
                customerName: name,
            });

            if (res.data.success && res.data.data.leadId) {
                // Navigate back, then to the chat
                router.back();
                setTimeout(() => {
                    router.push(`/chat/${res.data.data.leadId}`);
                }, 100);
            }
        } catch (error) {
            console.error('Failed to initiate conversation:', error);
            Alert.alert('Error', 'Could not start the conversation. Please try again.');
        } finally {
            setStartingChat(false);
        }
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

    const renderItem = ({ item }: { item: Contacts.Contact }) => {
        const name = item.name || item.firstName || 'Unknown';
        const initial = name.charAt(0).toUpperCase();
        const avatarColor = getAvatarColor(name);
        const textColor = getTextAvatarColor(name);
        const phone = item.phoneNumbers?.[0]?.number || 'No phone number';

        return (
            <TouchableOpacity 
                className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-950 active:bg-slate-100 dark:active:bg-slate-900"
                activeOpacity={0.7}
                onPress={() => startChat(item)}
            >
                <View className={`w-[44px] h-[44px] rounded-full ${avatarColor} items-center justify-center mr-4`}>
                    <Text className={`${textColor} font-medium text-lg`}>{initial}</Text>
                </View>
                
                <View className="flex-1 justify-center border-b border-slate-50 dark:border-slate-800/30 pb-3 pt-1">
                    <Text className="text-slate-900 dark:text-white font-medium text-[16px] mb-0.5" numberOfLines={1}>
                        {name}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 font-normal text-[14px]" numberOfLines={1}>
                        {phone}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-slate-950">
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View 
                className="px-2 pb-3 bg-white dark:bg-slate-950 flex-row items-center border-b border-slate-200 dark:border-slate-800/50 shadow-sm shadow-slate-100 dark:shadow-none"
                style={{ paddingTop: Math.max(insets.top, 16) }}
            >
                {isSearching ? (
                    <>
                        <TouchableOpacity 
                            onPress={() => {
                                setIsSearching(false);
                                setSearchQuery('');
                            }} 
                            className="p-2 mr-2"
                        >
                            <Ionicons name="arrow-back" size={24} color="#1f2937" className="dark:text-white" />
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 text-slate-900 dark:text-white text-[16px] h-10 px-2"
                            placeholder="Search contacts..."
                            placeholderTextColor="#8696A0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </>
                ) : (
                    <>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            className="p-2 mr-2"
                        >
                            <Ionicons name="arrow-back" size={24} color="#1f2937" className="dark:text-white" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-slate-900 dark:text-white font-medium text-xl">Select contact</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                {contacts.length} contacts
                            </Text>
                        </View>
                        <View className="flex-1" />
                        <TouchableOpacity className="p-2" onPress={() => setIsSearching(true)}>
                            <Ionicons name="search" size={22} color="#1f2937" className="dark:text-white" />
                        </TouchableOpacity>
                        <TouchableOpacity className="p-2" onPress={() => Alert.alert('Options', 'More options coming soon!')}>
                            <MaterialIcons name="more-vert" size={24} color="#1f2937" className="dark:text-white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
            
            {/* List */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#25D366" />
                </View>
            ) : (
                <FlatList
                    data={contacts.filter(c => {
                        const name = (c.name || c.firstName || '').toLowerCase();
                        const phone = c.phoneNumbers?.[0]?.number || '';
                        return name.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);
                    })}
                    keyExtractor={(item: any, index: number) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={20}
                />
            )}

            {/* Loading Overlay */}
            {startingChat && (
                <View className="absolute inset-0 bg-black/20 dark:bg-black/40 items-center justify-center z-50">
                    <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg items-center">
                        <ActivityIndicator size="large" color="#25D366" />
                        <Text className="text-slate-800 dark:text-white font-medium mt-4">Starting chat...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}
