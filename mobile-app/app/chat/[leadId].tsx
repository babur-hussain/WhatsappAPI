import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Keyboard, Alert, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io, { Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../../api/client';

export default function ChatScreen() {
    const { leadId } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const CACHE_KEY_MESSAGES = `offline_messages_${leadId}`;
    const CACHE_KEY_LEAD = `offline_lead_${leadId}`;

    const persistMessages = async (newMessages: any[]) => {
        setMessages(newMessages);
        await AsyncStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(newMessages));
    };

    useEffect(() => {
        const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const fetchMessages = async () => {
        try {
            const cachedMessages = await AsyncStorage.getItem(CACHE_KEY_MESSAGES);
            const cachedLead = await AsyncStorage.getItem(CACHE_KEY_LEAD);
            
            if (cachedMessages && cachedLead) {
                setMessages(JSON.parse(cachedMessages));
                setLead(JSON.parse(cachedLead));
                setLoading(false);
            }

            const res = await apiClient.get(`/conversations/${leadId}/messages`);
            if (res.data.success) {
                const freshLead = res.data.data.lead;
                const freshMessages = res.data.data.messages;
                
                setLead(freshLead);
                setMessages(freshMessages);
                
                await AsyncStorage.setItem(CACHE_KEY_LEAD, JSON.stringify(freshLead));
                await AsyncStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(freshMessages));
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = async () => {
        const token = await SecureStore.getItemAsync('accessToken');
        const socketUrl = process.env.EXPO_PUBLIC_API_URL || 'https://whatsappapi.lfvs.in';
        
        const socket = io(socketUrl, {
            query: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Connected to socket server (mobile)');
        });

        socket.on('new_message', (msg) => {
            if (msg.leadId === leadId) {
                setMessages((prev) => {
                    const newMsgs = [...prev, msg];
                    AsyncStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(newMsgs));
                    return newMsgs;
                });
                setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
            }
        });

        socket.on('message_status_update', (data) => {
            setMessages((prev) => {
                const newMsgs = prev.map(msg => 
                    msg.whatsappMessageId === data.whatsappMessageId
                        ? { 
                            ...msg, 
                            status: data.status,
                            deliveredAt: data.deliveredAt || msg.deliveredAt,
                            readAt: data.readAt || msg.readAt
                          }
                        : msg
                );
                AsyncStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(newMsgs));
                return newMsgs;
            });
        });

        socketRef.current = socket;
    };

    useEffect(() => {
        fetchMessages();
        setupSocket();
        
        return () => {
            socketRef.current?.disconnect();
        };
    }, [leadId]);

    const handleSend = async (customText?: string) => {
        const textToSend = customText || inputText.trim();
        if (!textToSend || sending) return;

        setSending(true);
        if (!customText) setInputText('');

        try {
            const res = await apiClient.post(`/conversations/${leadId}/reply`, {
                message: textToSend
            });
            if (res.data.success) {
                setMessages((prev) => {
                    const newMsgs = [...prev, res.data.data];
                    AsyncStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(newMsgs));
                    return newMsgs;
                });
                setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            if (!customText) setInputText(textToSend); // Restore if failed
        } finally {
            setSending(false);
        }
    };

    const uploadMedia = async (uri: string, name: string, mimeType: string) => {
        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: name,
            type: mimeType
        } as any);

        const res = await apiClient.post('/upload/media', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return res.data.data;
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const fileName = asset.uri.split('/').pop() || 'image.jpg';
            
            setSending(true);
            try {
                const uploadRes = await uploadMedia(asset.uri, fileName, asset.mimeType || 'image/jpeg');
                await apiClient.post(`/conversations/${leadId}/reply`, {
                    mediaUrl: uploadRes.url,
                    mediaType: 'image'
                });
                
                // Optimistically add to messages
                const mockMsg = {
                    id: Math.random().toString(),
                    content: `[Media: image] ${uploadRes.url}`,
                    sender: 'ADMIN',
                    status: 'SENT',
                    timestamp: new Date().toISOString()
                };
                setMessages((prev) => [mockMsg, ...prev]);
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to send image');
            } finally {
                setSending(false);
            }
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const doc = result.assets[0];
                const mimeType = doc.mimeType || 'application/octet-stream';
                const isImage = mimeType.startsWith('image/');
                const mediaType = isImage ? 'image' : 'document';
                
                setSending(true);
                try {
                    const uploadRes = await uploadMedia(doc.uri, doc.name, mimeType);
                    await apiClient.post(`/conversations/${leadId}/reply`, {
                        mediaUrl: uploadRes.url,
                        mediaType: mediaType
                    });
                    
                    const mockMsg = {
                        id: Math.random().toString(),
                        content: `[Media: ${mediaType}] ${uploadRes.url}`,
                        sender: 'ADMIN',
                        status: 'SENT',
                        timestamp: new Date().toISOString()
                    };
                    setMessages((prev) => [mockMsg, ...prev]);
                } catch (error) {
                    console.error(error);
                    Alert.alert('Error', `Failed to send ${mediaType}`);
                } finally {
                    setSending(false);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const renderTicks = (msg: any) => {
        const isSentByUs = msg.sender === 'ADMIN' || msg.sender === 'BOT';
        if (!isSentByUs) return null;
        
        let color = '#8696A0'; // Grey ticks
        let iconName = 'checkmark'; // Single tick for sent
        
        const status = msg.status ? msg.status.toUpperCase() : 'SENT';

        if (status === 'DELIVERED') {
            iconName = 'checkmark-done';
        } else if (status === 'READ') {
            iconName = 'checkmark-done';
            color = '#53BDEB'; // Blue ticks
        } else if (status === 'FAILED') {
            iconName = 'alert-circle';
            color = '#f87171'; // red-400
        }

        return (
            <Ionicons name={iconName as any} size={15} color={color} style={{ marginLeft: 4, marginTop: 1 }} />
        );
    };

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        const isSentByUs = item.sender === 'ADMIN' || item.sender === 'BOT';
        const time = new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

        let mediaUrl = null;
        let textContent = item.content || '';

        const mediaMatch = textContent.match(/^\[Media: (image|document|video|audio)\] (https?:\/\/[^\s]+)(?:\n([\s\S]*))?$/);
        const isImage = mediaMatch ? mediaMatch[1] === 'image' : textContent.startsWith('[Media: image]');
        const isDocument = mediaMatch ? mediaMatch[1] !== 'image' : textContent.startsWith('[Media: document]');

        if (mediaMatch) {
            mediaUrl = mediaMatch[2];
            textContent = mediaMatch[3] || '';
        } else if (isImage || isDocument) {
            mediaUrl = textContent.split('] ')[1]?.trim();
            textContent = '';
        }

        return (
            <View className={`flex-row mb-1 px-3 ${isSentByUs ? 'justify-end' : 'justify-start'}`}>
                <View 
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                        elevation: 1,
                        flexDirection: 'column',
                        alignItems: isImage ? 'center' : 'flex-start',
                        padding: isImage ? 4 : undefined,
                    }}
                    className={`max-w-[85%] ${!isImage && 'px-2.5 py-1.5'} rounded-xl ${
                        isSentByUs 
                            ? 'bg-[#E7FFDB] rounded-tr-none' 
                            : 'bg-white rounded-tl-none'
                    }`}
                >
                    {isImage ? (
                        <Image source={{ uri: mediaUrl }} style={{ width: 220, height: 220, borderRadius: 8, backgroundColor: '#e5e7eb' }} resizeMode="cover" />
                    ) : isDocument ? (
                        <View className="flex-row items-center bg-gray-100 p-2 rounded-lg mb-1 w-48">
                            <Ionicons name="document-text" size={24} color="#666" />
                            <Text className="ml-2 flex-1 text-gray-700 font-medium truncate">Document</Text>
                        </View>
                    ) : null}
                    
                    {(textContent || (!isImage && !isDocument)) ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: (isImage && textContent) ? 4 : 0 }}>
                            <Text className="text-[#111B21] text-[16px] leading-[22px]">
                                {textContent || item.content}
                            </Text>
                            <View className="flex-row items-center ml-2" style={{ marginTop: 2 }}>
                                <Text className="text-[#667781] text-[11px] leading-[15px]">
                                    {time}
                                </Text>
                                {renderTicks(item)}
                            </View>
                        </View>
                    ) : (
                        <View className="flex-row items-center mt-1 self-end" style={{ marginRight: 4, marginBottom: 2 }}>
                            <Text className="text-[#667781] text-[11px] leading-[15px]">
                                {time}
                            </Text>
                            {renderTicks(item)}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-[#EFEAE2]">
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                enabled={Platform.OS === 'ios'}
            >
                <View className="flex-1" style={{ paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}>
                    {/* Header */}
                    <View 
                        className="px-1 pb-2 bg-white flex-row items-center border-b border-slate-200 z-10"
                        style={{ paddingTop: Math.max(insets.top, 10) }}
                    >
                        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center py-2 pl-1 pr-1 rounded-full">
                            <Ionicons name="arrow-back" size={26} color="#111B21" />
                        </TouchableOpacity>
                        
                        <View className="w-10 h-10 rounded-full bg-[#CCE5FF] items-center justify-center mr-3">
                            <Text className="text-[#005C4B] font-medium text-xl">
                                {lead?.customerName ? lead.customerName.charAt(0).toUpperCase() : lead?.customerPhone ? lead.customerPhone.charAt(0) : '?'}
                            </Text>
                        </View>
                        <View className="flex-1 justify-center">
                            <Text className="text-[#111B21] font-bold text-[17px] tracking-tight mb-0.5">
                                {lead?.customerName || lead?.customerPhone || 'Customer'}
                            </Text>
                            {lead?.customerPhone && (
                                <Text className="text-[#54656F] text-[13px] font-medium">
                                    {lead.customerPhone}
                                </Text>
                            )}
                        </View>
                        
                        <TouchableOpacity className="p-3">
                            <MaterialIcons name="more-vert" size={24} color="#111B21" />
                        </TouchableOpacity>
                    </View>

                    {/* Chat Area */}
                    <View className="flex-1">
                        {loading ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#00A884" />
                            </View>
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={[...messages].reverse()}
                                inverted
                                keyExtractor={(item) => item.id}
                                renderItem={renderMessage}
                                contentContainerStyle={{ paddingVertical: 12 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>

                    {/* Input Area */}
                    <View 
                        className="flex-row items-end px-1.5 pt-1.5 bg-transparent"
                        style={{ paddingBottom: keyboardHeight > 0 ? 24 : Math.max(insets.bottom + 4, 20) }}
                    >
                        <View className="flex-1 flex-row items-end bg-white rounded-3xl min-h-[48px] mr-1.5 px-1 py-0.5" style={{ elevation: 1 }}>
                            <TouchableOpacity className="p-2.5 justify-center">
                                <MaterialCommunityIcons name="emoticon-happy-outline" size={26} color="#8696A0" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 text-[#111B21] text-[17px] px-1 py-3 max-h-32"
                                placeholder="Message"
                                placeholderTextColor="#8696A0"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                selectionColor="#00A884"
                            />
                            <TouchableOpacity className="p-2.5 justify-center mr-1" onPress={handlePickDocument}>
                                <Entypo name="attachment" size={20} color="#8696A0" />
                            </TouchableOpacity>
                            {!inputText.trim() && (
                                <TouchableOpacity className="p-2.5 justify-center mr-1" onPress={handlePickImage}>
                                    <Ionicons name="camera" size={24} color="#8696A0" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => inputText.trim() ? handleSend() : undefined}
                            activeOpacity={0.7}
                            className="h-12 w-12 rounded-full bg-[#00A884] items-center justify-center mb-0.5"
                            style={{ elevation: 1 }}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : inputText.trim() ? (
                                <Ionicons name="send" size={20} color="white" style={{ marginLeft: 4 }} />
                            ) : (
                                <MaterialCommunityIcons name="microphone" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
