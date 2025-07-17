import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { getWeather, getWeatherByCity } from './services/weatherService';
import { getPretrainedPlantingAdvice } from './services/aiService';

export default function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [cityWeather, setCityWeather] = useState(null);
  const [locationAdvice, setLocationAdvice] = useState(null);
  const [cityAdvice, setCityAdvice] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchCurrentLocationWeather();
  }, []);

  const fetchCurrentLocationWeather = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const weatherData = await getWeather(
        location.coords.latitude,
        location.coords.longitude,
        Constants.expoConfig.extra.WEATHER_API_KEY
      );
      setCurrentWeather(weatherData);
      setLocationAdvice(getPretrainedPlantingAdvice(weatherData)); // Getting planting advice for current location
    } catch (error) {
      setErrorMessage('Failed to get weather for current location');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherForCity = async () => {
    if (!city) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const weatherData = await getWeatherByCity(city, Constants.expoConfig.extra.WEATHER_API_KEY);
      setCityWeather(weatherData);
      setCityAdvice(getPretrainedPlantingAdvice(weatherData)); // Getting planting advice for city
    } catch (error) {
      setErrorMessage('City not found or weather data unavailable');
    } finally {
      setLoading(false);
    }
  };

  const renderWeatherBlock = (title, weather, advice) => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text>📍 Location: {weather.name}</Text>
      <Text>🌡️ Temperature: {weather.main.temp}°C</Text>
      <Text>💧 Humidity: {weather.main.humidity}%</Text>
      <Text>🌤️ Condition: {weather.weather[0].description}</Text>

      {advice?.planting && (
        <View style={styles.adviceBlock}>
          <Text style={styles.adviceTitle}>🌱 Planting Advice</Text>
          <Text style={styles.adviceText}>{advice.planting}</Text>
        </View>
      )}

      {advice?.pesticide && (
        <View style={styles.adviceBlock}>
          <Text style={styles.adviceTitle}>🧪 Pesticide Control</Text>
          <Text style={styles.adviceText}>{advice.pesticide}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌿 Smart Farming Assistant</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter city name"
          style={styles.input}
          value={city}
          onChangeText={setCity}
        />
        <Button title="Check City Weather" onPress={fetchWeatherForCity} />
      </View>

      <View style={{ marginVertical: 10 }}>
        <Button title="Refresh Current Location Weather" onPress={fetchCurrentLocationWeather} />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {currentWeather && renderWeatherBlock("📍 Current Location", currentWeather, locationAdvice)}
      {cityWeather && renderWeatherBlock(`🏙️ ${cityWeather.name}`, cityWeather, cityAdvice)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  adviceBlock: { marginTop: 15 },
  adviceTitle: { fontWeight: 'bold', color: '#2c3e50' },
  adviceText: { marginTop: 5, fontStyle: 'italic' },
  errorText: { color: 'red', marginTop: 10 },
});
