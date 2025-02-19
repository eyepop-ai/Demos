import "react-native-polyfill-globals/auto"; // Ensures polyfills are available
import React, {useEffect} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useIsFocused} from '@react-navigation/native'; // Ensures API call only happens when the tab is active
import EyePop, {ForwardOperatorType, PopComponentType, StreamSource} from '@eyepop.ai/eyepop';
import {ImagePickerAsset} from "expo-image-picker/src/ImagePicker.types";

import {pino} from "pino";

import * as FileSystem from 'expo-file-system';
import {EncodingType} from 'expo-file-system';

import { Buffer } from "buffer";

// Explicitly set Buffer globally
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

const logger = pino({ level: "debug", name: "eyepop-example" });

export default function TabOneScreen() {
  const isFocused = useIsFocused(); // Ensures API runs when tab is active
  const [isProcessing, setIsProcessing] = React.useState(false);

  useEffect(() => {
    if (isFocused) {
      sendImageToEyePop();
    }
  }, [isFocused]);

  // Function to send an image to EyePop.ai
  const sendImageToEyePop = async () => {
    setIsProcessing(true);
    try {
      // Pick an image (optional: for testing)
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos', 'livePhotos'],
        quality: 1
      });

      if (picked.canceled) {
        return;
      }
      const popUUID = " your pop id ";
      const apiKey = " your secret api key ";
      // Initialize the EyePop worker endpoint
      let endpoint = EyePop.workerEndpoint({
        auth: { secretKey: apiKey },
        popId: popUUID,
          logger: logger
      });

      console.log('Connecting Endpoint ...');
      
      try {
        endpoint = await endpoint.connect();
      } catch (error) {
        console.error("Error during connection:", error);
        return
      }

      console.log(`About to send asset ${picked.assets[0].fileName} `+
          `with mimeType=${picked.assets[0].mimeType} `+
          `and length=${picked.assets[0].fileSize}`);

      // Using the PathSource with a local file path to start the upload to the AI worker.
      // React Native does not support streaming HTTP request bodies, hence the library
      // will attempt to load the whole file into memory which can cause OOM errors.
      // TODO: EyePop library to provide platform specific fix.
      let results = await endpoint.process({
        path: picked.assets[0].uri.substring('file://'.length),
        mimeType: picked.assets[0].mimeType
      })

      console.log('Retrieving inference results ...');
      for await (let result of results) {
        console.log(JSON.stringify(result, undefined, 2));
      }

      Alert.alert('Success', `${picked.assets[0].mimeType} sent successfully!`);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (isProcessing) ? (
    <View style={styles.container}>
      <Text style={styles.title}>Test Upload</Text>
      <View style={styles.separator} />
      <Text>Sending Image to EyePop.ai...</Text>
    </View>
  ):(
    <View style={styles.container}>
      <Text style={styles.title}>Test Upload</Text>
      <View style={styles.separator} />
      <Text>Test Again</Text>
      <Text style={styles.link} onPress={sendImageToEyePop}>Send Image</Text>
    </View>
  );
}
// Function to convert image URI to Blob
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return await response.blob();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});