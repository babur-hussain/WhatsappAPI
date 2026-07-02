import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Profile Fields
    const [about, setAbout] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [website1, setWebsite1] = useState('');
    const [website2, setWebsite2] = useState('');
    const [vertical, setVertical] = useState('OTHER');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/settings/whatsapp-profile');
            if (res.data.success) {
                const profile = res.data.data.profile || {};
                setAbout(profile.about || '');
                setDescription(profile.description || '');
                setAddress(profile.address || '');
                setEmail(profile.email || '');
                setProfilePictureUrl(profile.profile_picture_url || '');
                setVertical(profile.vertical || 'OTHER');
                
                if (profile.websites && profile.websites.length > 0) {
                    setWebsite1(profile.websites[0] || '');
                    setWebsite2(profile.websites[1] || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            Alert.alert('Error', 'Failed to load WhatsApp profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const websites = [];
            if (website1.trim()) websites.push(website1.trim());
            if (website2.trim()) websites.push(website2.trim());

            const payload = {
                about: about.trim(),
                description: description.trim(),
                address: address.trim(),
                email: email.trim(),
                vertical: vertical,
                websites
            };

            const res = await apiClient.post('/settings/whatsapp-profile', payload);
            if (res.data.success) {
                Alert.alert('Success', 'Profile updated successfully on Meta');
            } else {
                throw new Error(res.data.error || 'Failed to update');
            }
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            Alert.alert('Error', error?.response?.data?.message || error.message || 'Failed to update WhatsApp profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#00A884" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F0F2F5]" edges={['top']}>
            <View className="px-4 py-3 bg-white flex-row items-center border-b border-gray-200">
                <Text className="text-xl font-bold text-[#111B21]">Business Profile</Text>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    
                    <View className="items-center mb-6 mt-4">
                        <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden mb-3">
                            {profilePictureUrl ? (
                                <Image source={{ uri: profilePictureUrl }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <Ionicons name="business" size={60} color="#8696A0" />
                            )}
                        </View>
                        <Text className="text-sm text-gray-500 text-center px-4">
                            To change your profile picture, please visit the Meta Business Manager.
                        </Text>
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-4">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">About (Short)</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21]"
                            value={about}
                            onChangeText={setAbout}
                            placeholder="e.g. Available"
                            maxLength={139}
                        />
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-4">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">Description</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21] min-h-[60px]"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your business..."
                            multiline
                            maxLength={256}
                        />
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-4">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">Category (Vertical)</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21]"
                            value={vertical}
                            onChangeText={setVertical}
                            placeholder="e.g. OTHER, RETAIL, EDUCATION..."
                            autoCapitalize="characters"
                        />
                        <Text className="text-xs text-gray-400 mt-1">Must be a valid Meta vertical code (e.g. RETAIL)</Text>
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-4">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">Address</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21] min-h-[60px]"
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Business physical address"
                            multiline
                            maxLength={256}
                        />
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-4">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">Email Address</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21]"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="contact@yourbusiness.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            maxLength={128}
                        />
                    </View>

                    <View className="bg-white rounded-2xl p-4 mb-6">
                        <Text className="text-[#00A884] font-semibold mb-1 text-sm">Websites (Up to 2)</Text>
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21] mb-2"
                            value={website1}
                            onChangeText={setWebsite1}
                            placeholder="https://www.yourbusiness.com"
                            keyboardType="url"
                            autoCapitalize="none"
                            maxLength={256}
                        />
                        <TextInput
                            className="border-b border-gray-300 py-2 text-base text-[#111B21]"
                            value={website2}
                            onChangeText={setWebsite2}
                            placeholder="https://shop.yourbusiness.com (Optional)"
                            keyboardType="url"
                            autoCapitalize="none"
                            maxLength={256}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className={`bg-[#00A884] py-4 rounded-xl items-center flex-row justify-center ${saving ? 'opacity-70' : ''}`}
                    >
                        {saving ? (
                            <ActivityIndicator color="white" className="mr-2" />
                        ) : (
                            <Ionicons name="save-outline" size={20} color="white" className="mr-2" />
                        )}
                        <Text className="text-white text-[16px] font-bold ml-2">
                            {saving ? 'Saving to Meta...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
