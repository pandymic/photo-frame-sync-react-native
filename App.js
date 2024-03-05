import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet, Animated, Easing, ActivityIndicator, Text, Image, Dimensions, Pressable } from 'react-native';
import * as Font from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const SwitchImage = ( props ) => {

  const [ previousImage, setPreviousImage ] = useState( props.source );
  const opacity = useRef( new Animated.Value( 0 ) ).current;

  useEffect( () => {
    Animated.timing( opacity, {
      toValue: 1,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true
    } ).start( () => {
      setPreviousImage( props.source );
      opacity.setValue( 0 );
    } )
  }, [ props.source ] )

  return(
    <View style={props.style}>
      <Image style={props.style} source={previousImage} />
      <Animated.View style={{opacity: opacity}}>
        <Image style={props.style} source={props.source} />
      </Animated.View>
    </View>
  )
}

const setLandscapeOrientation = async () => {
  return await ScreenOrientation.lockAsync( ScreenOrientation.OrientationLock.LANDSCAPE );
}

const getTimeString = () => {
  const now = new Date();
  return now.getHours().toString().padStart( 2, '0' ) + ':' + now.getMinutes().toString().padStart( 2, '0' );
}

export default function App() {

  const [fontsLoaded, fontError] = Font.useFonts({
    'Albert-Sans': require('./assets/AlbertSans-VariableFont_wght.ttf'),
  });

  const [ isLoading, setLoading ] = useState( true );
  const [ isInfoVisible, setIsInfoVisible ] = useState( false );
  const [ screenUnitsData, setScreenUnitsData ] = useState( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
  const [ imageData, setImageData ] = useState( { src: false, lastSrc: false } );
  const [ timeData, setTimeData ] = useState( getTimeString() );
  
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
  
  const vw = ( value ) => value * screenUnitsData.vw, vh = ( value ) => value * screenUnitsData.vh;

  const getImage = async () => {

    try {
      const response = await fetch( apiBaseUrl + '/index.php?action=checkPhotoUpdate' );
      const json = await response.json();

      if ( imageData.src !== json.src ) {
        const newImageData = {
          src: json.src,
          lastSrc: imageData.src
        };
        setImageData( newImageData );
      }
      const timer = setTimeout( () => getImage(), 5000 );

    } catch (error) {
      console.error( error );
    } finally {
      setLoading( false );
    }
  }

  useEffect( () => {
    if ( isLoading ) {
      setLandscapeOrientation().then( () => {
        getImage();
      } );
    }
    setScreenUnitsData( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
    setInterval( () => {
      const newTimeData = getTimeString();
      if ( newTimeData !== timeData ) {
        setTimeData( newTimeData );
      }
    }, 1000 );
  }, [] );

  const onLayoutRootView = useCallback( async () => {
    if ( fontsLoaded || fontError ) {
      await SplashScreen.hideAsync();
    }
    setScreenUnitsData( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
  }, [fontsLoaded, fontError] );

  if ( !fontsLoaded && !fontError ) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar hidden={true} />
      <View style={ isLoading ? StyleSheet.flatten([styles.container, { justifyContent: 'center', alignItems: 'center' } ]) : styles.container } onLayout={onLayoutRootView}>
        { isLoading ? (
          <ActivityIndicator />
        ) : (
          <Pressable style={styles.container} onPress={() => setIsInfoVisible( !isInfoVisible ) }>
            <SwitchImage style={styles.image} source={{uri: imageData.src}} />
            { isInfoVisible &&
              <View style={{ position: 'absolute', right: vw( 3.5 ), bottom: vw( 3.5) }}>
                <Text style={StyleSheet.flatten([styles.info.text, { fontSize: vh( 12.5 ), lineHeight: vh( 12.5 ) }])}>{timeData}</Text>
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
    backgroundColor: '#101010',
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'stretch',
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'stretch',
  },
  image: {
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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