import "react-native-polyfill-globals/auto"; // Ensures polyfills are available
import { Buffer } from "buffer";

// Explicitly set Buffer globally
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

import React, { useEffect } from 'react';
import { StyleSheet, Image, View, Text, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system'; // Used to read image data
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native'; // Ensures API call only happens when the tab is active
import EyePop from '@eyepop.ai/eyepop';
//import Render2d from '@eyepop.ai/eyepop-render-2d'


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
      const image = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // This should work,
        allowsEditing: true,
        base64: true, // Get base64 data
        quality: 1,
      });

      if (image.canceled) {
        return;
      }

      const popUUID = "<POP UUID>"
      const apiKey = "<api key>"
      
      console.log('Image selected.');  
      console.log("Endpoint:", EyePop.workerEndpoint);

      // Initialize the EyePop worker endpoint
      let endpoint = EyePop.workerEndpoint({
        auth: { secretKey: apiKey },
        popId: popUUID,  // Replace with actual Pop ID
      });

      console.log('Endpoint initialized:', endpoint);
      
      try {
        console.log("Calling .connect()...");
        endpoint = await endpoint.connect();
        console.log("Successfully connected:", endpoint);
      } catch (error) {
        console.error("Error during connection:", error);
        //console.error("🛠 Full Error Stack:", error.stack);
        return
      }
      
      console.log('Endpoint connected:', endpoint);

      console.log(endpoint)

      const uri = image.assets[0].uri; // Extracts the first selected image
      const type = "image/jpeg"; // Adjust if needed

      console.log('Image URI:', uri); // Log the image URI  
  
      const blob = await uriToBlob(uri);

      const file = new File([blob], "upload.jpg", { type: "image/jpeg" });
    
      console.log('File created:', file); 
      let results = await endpoint.process({
        file: file,
        mimeType: 'image/*',
      })

      let jsonResponse = null;

      for await (let result of results) {
        console.log(result)
        jsonResponse = result;
      
      }

      Alert.alert('Success', 'Image sent successfully!\r\n'+JSON.stringify(jsonResponse) );

    } catch (error) {
      console.log('Error:', error);
      console.error('Error sending image:', error);
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
  const blob = await response.blob();
  return blob;
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