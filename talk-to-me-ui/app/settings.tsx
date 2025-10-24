import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Image, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bgColor, setBgColor] = useState('#000');
    const [fontFamily, setFontFamily] = useState('Courier New');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (Platform.OS === 'web') {
                    setName(localStorage.getItem('name') || '');
                    setEmail(localStorage.getItem('email') || '');
                    setBgColor(localStorage.getItem('bgColor') || '#000');
                    setFontFamily(localStorage.getItem('fontFamily') || 'Courier New');
                    setProfileImage(localStorage.getItem('profileImage') || null);
                } else {
                    const storedName = await AsyncStorage.getItem('name');
                    const storedEmail = await AsyncStorage.getItem('email');
                    const storedBg = await AsyncStorage.getItem('bgColor');
                    const storedFont = await AsyncStorage.getItem('fontFamily');
                    const storedImg = await AsyncStorage.getItem('profileImage');
                    if (storedName) setName(storedName);
                    if (storedEmail) setEmail(storedEmail);
                    if (storedBg) setBgColor(storedBg);
                    if (storedFont) setFontFamily(storedFont);
                    if (storedImg) setProfileImage(storedImg);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            }
        };
        loadSettings();
    }, []);

    // Pick image from gallery
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;
                setProfileImage(uri);
            }
        } catch (err) {
            console.error('Error picking image:', err);
        }
    };

    // Save settings to local storage
    const handleSave = async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('name', name);
                localStorage.setItem('email', email);
                localStorage.setItem('bgColor', bgColor);
                localStorage.setItem('fontFamily', fontFamily);
                if (profileImage) localStorage.setItem('profileImage', profileImage);
            } else {
                await AsyncStorage.setItem('name', name);
                await AsyncStorage.setItem('email', email);
                await AsyncStorage.setItem('bgColor', bgColor);
                await AsyncStorage.setItem('fontFamily', fontFamily);
                if (profileImage) await AsyncStorage.setItem('profileImage', profileImage);
            }
            Alert.alert('Settings Saved', 'Your profile and preferences have been updated.');
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>
            <Text style={[styles.title, { fontFamily }]}>Settings</Text>

            {/* Profile Image Section */}
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={{ color: '#aaa', fontFamily }}>Add Profile Image</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                <Text style={[styles.changeText, { fontFamily }]}>Change Image</Text>
            </TouchableOpacity>

            {/* Profile Info */}
            <Text style={[styles.label, { fontFamily }]}>Name</Text>
            <TextInput
                style={[styles.input, { fontFamily }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
            />

            <Text style={[styles.label, { fontFamily }]}>Email</Text>
            <TextInput
                style={[styles.input, { fontFamily }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
            />

            <Text style={[styles.label, { fontFamily }]}>Password</Text>
            <TextInput
                style={[styles.input, { fontFamily }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry
            />

            {/* Theme Options */}
            <Text style={[styles.label, { fontFamily }]}>Background Color</Text>
            <View style={styles.colorRow}>
                {['#000', '#1a1a1a', '#4b0082', '#0a9396', '#ff69b4'].map(color => (
                    <TouchableOpacity
                        key={color}
                        style={[
                            styles.colorOption,
                            { backgroundColor: color, borderColor: bgColor === color ? '#fff' : 'transparent' }
                        ]}
                        onPress={() => setBgColor(color)}
                    />
                ))}
            </View>

            <Text style={[styles.label, { fontFamily }]}>Font Style</Text>
            <View style={styles.fontRow}>
                {['Courier New', 'Arial', 'Times New Roman', 'Verdana'].map(font => (
                    <TouchableOpacity
                        key={font}
                        style={[styles.fontButton, fontFamily === font && styles.fontSelected]}
                        onPress={() => setFontFamily(font)}
                    >
                        <Text style={{ color: '#fff', fontFamily: font }}>{font}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={[styles.saveText, { fontFamily }]}>Save Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={[styles.backText, { fontFamily }]}>← Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 20,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        marginBottom: 15,
        textShadowColor: '#ff69b4',
        textShadowRadius: 5,
    },
    imageContainer: {
        borderRadius: 100,
        overflow: 'hidden',
        marginBottom: 10,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#ff69b4',
    },
    placeholder: {
        width: 120,
        height: 120,
        borderRadius: 100,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeButton: {
        marginBottom: 20,
    },
    changeText: {
        color: '#4fc3f7',
        fontSize: 16,
    },
    label: {
        color: '#fff',
        fontSize: 18,
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
    },
    fontRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 30,
    },
    fontButton: {
        backgroundColor: '#333',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        margin: 5,
    },
    fontSelected: {
        backgroundColor: '#ff69b4',
    },
    saveButton: {
        backgroundColor: '#ff69b4',
        paddingVertical: 12,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 18,
    },
    backButton: {
        marginTop: 15,
    },
    backText: {
        color: '#4fc3f7',
        fontSize: 16,
    },
});
