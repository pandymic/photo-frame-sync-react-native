import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet, Animated, Easing, ActivityIndicator, Text, Image, Dimensions, Pressable } from 'react-native';
// import Svg, { Rect, Circle } from 'react-native-svg';
// import SvgXml from 'react-native-svg';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const blankImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjmNlR/h8ABe4CmEDzMXYAAAAASUVORK5CYII=';

SplashScreen.preventAutoHideAsync();

const SwitchImage = ( props ) => {

  const [ prevSourceUri, setPrevSourceUri ] = useState( blankImageUri );
  const [ isAnimationRunning, setIsAnimationRunning ] = useState( false );
  const [ opacity ] = useState( new Animated.Value( 0 ) );

  useEffect( () => {

    if ( props.source.uri !== prevSourceUri && !isAnimationRunning ) {

      setIsAnimationRunning( true );

      // console.log( 'SwitchImage useEffect props.source.uri', props.source.uri.substring( 0, 64 ) );
      // console.log( 'SwitchImage useEffect prevSourceUri', prevSourceUri.substring( 0, 64 ) );

      Animated.timing( opacity, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: true,
      } ).start(() => {
        setPrevSourceUri( props.source.uri );
        opacity.setValue( 1 );
        setIsAnimationRunning( false );
      } );

    }

  }, [ props.source ]);

  return (
    <View style={props.style}>
      <Image source={{uri: props.source.uri }} style={{ flex: 1 }} />
      { prevSourceUri && (
        <Animated.Image source={{uri: prevSourceUri}} style={{ ...StyleSheet.absoluteFill, opacity: opacity }} />
      ) }
    </View>
  );
};

export default function App() {

  const [ isFontsLoaded, isFontError ] = Font.useFonts( { 'Albert-Sans': require('./assets/AlbertSans-VariableFont_wght.ttf') } );
  const [ isImageLoading, setIsImageLoading ] = useState( false );
  const [ isImageInitialized, setIsImageInitialized ] = useState( false );
  const [ isAppRunning, setIsAppRunning ] = useState( false );
  const [ isInfoVisible, setIsInfoVisible ] = useState( false );
  const [ screenUnitsData, setScreenUnitsData ] = useState( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
  const [ imageData, setImageData ] = useState( { uri: blankImageUri, lastUri: false } );
  const [ timeData, setTimeData ] = useState( '' );
  
  const vw = ( value ) => value * screenUnitsData.vw, vh = ( value ) => value * screenUnitsData.vh, timeInterval = setInterval( () => {
    const newTimeData = ( () => {
      const now = new Date();
      return now.getHours().toString() + ':' + now.getMinutes().toString().padStart( 2, '0' );
    } )();
    if ( newTimeData !== timeData ) {
      setTimeData( newTimeData );
    }
  }, 1000 );

  const setImage = async ( imageData ) => {

    // console.log( 'setImage', 'Running image update check...' );

    setIsImageLoading( true );
 
    try {

      const response = await fetch( apiBaseUrl + '/index.php?action=checkPhotoUpdate' );
      const json = await response.json();

      if ( imageData.uri !== json.src ) {

        // console.log( 'setImage', 'Updating image...' );
        
        const newImageData = {
          uri: json.src,
          lastUri: imageData.uri
        };

        // console.log( 'imageData', imageData.uri.substring( 0, 64 ) );
        // console.log( 'newImageData', imageData.uri.substring( 0, 64 ) );

        setImageData( newImageData );
      }

    } catch (error) {

      console.error( error );
      const newImageData = {
        uri: blankImageUri,
        lastUri: imageData.uri
      };
      setImageData( newImageData );

    } finally {

      setIsImageLoading( false );
      if ( !isImageInitialized ) {
        setIsImageInitialized( true );
      }

    }

  }

  useEffect( () => {

    // console.log( 'useEffect', 'Running...' );

    if ( isFontsLoaded && isImageInitialized && !isAppRunning ) {

      // console.log( 'useEffect', 'Running once...' );

      setScreenUnitsData( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
      SplashScreen.hideAsync();
      setIsAppRunning( true );

    } else {

      // console.log( 'isFontsLoaded', isFontsLoaded );
      // console.log( 'isImageInitialized', isImageInitialized );

      if ( !isImageInitialized && !isImageLoading ) {
        // console.log( 'useEffect', 'Initializing image...' );
        setImage( imageData )
      } else if ( !isImageLoading ) {
        // console.log( 'useEffect', 'Queueing image update check...' );
        setTimeout( () => setImage( imageData ), 5000 );
      }

    }
  
  }, [ isFontsLoaded, isImageInitialized, isImageLoading ] );

  if ( !isFontsLoaded || isFontError ) {
    return null;
  }

  return (
    <SafeAreaView style={{ ...styles.screen, ...styles.container }}>
      <StatusBar hidden={true} />
      <View style={ !isImageInitialized ? StyleSheet.flatten([styles.container, { justifyContent: 'center', alignItems: 'center' } ]) : styles.container }>
        { !isImageInitialized ? (
          <ActivityIndicator />
        ) : (
          <Pressable style={styles.container} onPress={() => setIsInfoVisible( !isInfoVisible ) }>
            <SwitchImage style={styles.container} source={{uri: imageData.uri}} />
            { isInfoVisible &&
              <View style={{ ...styles.info.wrapper, right: vw( 3.5 ), bottom: vw( 3.5) }}>
                <Text style={{ ...styles.info.text, fontSize: vh( 12.5 ), lineHeight: vh( 12.5 ) }}>{timeData}</Text>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {/* <View style={{ width: vh( 5 ), height: vh( 5 ), marginRight: vh( 1 ), backgroundColor: '#f0f' }} />
                  <Svg style={{ width: vh( 5 ), height: vh( 5 ), marginRight: vh( 1 ), backgroundColor: '#0f0' }}></Svg>
                  <Text style={{ ...styles.info.text, fontSize: vh( 5 ), lineHeight: vh( 5 ) }}>4°C</Text> */}
                </View>
              </View>
            }
          </Pressable>
        ) }
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create( {
  screen: {
    backgroundColor: '#998877',
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'stretch',
  },
  info: {
    wrapper: {
      position: 'absolute',
      right: 50,
      bottom: 50,
    },
    text: {
      color: '#fff',
      fontFamily: 'Albert-Sans',
      fontWeight: 300,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2.5
    },
  }
} );