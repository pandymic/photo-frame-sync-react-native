import React, { useEffect, useState } from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet, Animated, Easing, ActivityIndicator, Text, Image, Dimensions, Pressable } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const blankImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjmNlR/h8ABe4CmEDzMXYAAAAASUVORK5CYII=';

SplashScreen.preventAutoHideAsync();
ScreenOrientation.lockAsync( ScreenOrientation.OrientationLock.LANDSCAPE );

const SwitchImage = ( props ) => {

  const [ prevSourceUri, setPrevSourceUri ] = useState( blankImageUri );
  const [ isAnimationRunning, setIsAnimationRunning ] = useState( false );
  const [ opacity ] = useState( new Animated.Value( 0 ) );

  useEffect( () => {

    if ( props.source.uri !== prevSourceUri && !isAnimationRunning ) {

      setIsAnimationRunning( true );

      // console.log( 'SwitchImage useEffect props.source.uri', props.source.uri.substring( 0, 32 ) );
      // console.log( 'SwitchImage useEffect prevSourceUri', prevSourceUri.substring( 0, 32 ) );

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
  const [ isAppRunning, setIsAppRunning ] = useState( false );
  const [ isInfoVisible, setIsInfoVisible ] = useState( false );
  const [ screenUnitsData, setScreenUnitsData ] = useState( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
  const [ timeData, setTimeData ] = useState( { hours: false, minutes: false } );
  const [ secondTick, setSecondTick ] = useState( true );
  const [ isImageInitialized, setIsImageInitialized ] = useState( false );
  const [ imageData, setImageData ] = useState( { uri: blankImageUri, lastUri: false } );
  const [ isWeatherInitialized, setIsWeatherInitialized ] = useState( false );
  const [ weatherData, setWeatherData ] = useState( { html: false, icon: false, text: false } );
  const [ isGreetingInitialized, setIsGreetingInitialized ] = useState( false );
  const [ greetingData, setGreetingData ] = useState( { html: false, icon: false, text: false } );
  
  const vw = ( value ) => value * screenUnitsData.vw, vh = ( value ) => value * screenUnitsData.vh;

  const setImage = async ( imageData ) => {

    setIsImageInitialized( true );

    // console.log( 'setImage' );

    let newImageData = {...imageData};
 
    try {

      const response = await fetch( apiBaseUrl + '/index.php?action=checkPhotoUpdate' );
      const json = await response.json();

      if ( imageData.uri !== json.src ) {

        newImageData.uri = json.src;
        newImageData.lastUri = imageData.uri;

        setImageData( newImageData );
      }

    } catch (error) {

      // console.error( error );

    } finally {

      setTimeout( () => setImage( newImageData ), 5000 );

    }

  }

  const setWeather = async ( weatherData ) => {
 
    setIsWeatherInitialized( true );

    // console.log( 'setWeather' );

    let newWeatherData = {...weatherData};

    try {

      const response = await fetch( apiBaseUrl + '/index.php?action=weatherUpdate' );
      const json = await response.json();

      if ( weatherData.html !== json.html ) {

        newWeatherData.html = json.html;

        const hasIcon = json.html.indexOf( '<svg' );
        if ( -1 !== hasIcon ) {
          newWeatherData.icon = json.html.substring( hasIcon ).replace(/ ((style)|(fill)|(id))="[^"]+"/, '').replace(/^<svg/, '<svg fill="#fff" width="30" height="30"').trim();
          newWeatherData.text = json.html.substring( 0, hasIcon ).trim().replace( '&deg;', '°' );
        } else {
          newWeatherData.icon = false;
          newWeatherData.text = json.html.trim().replace( '&deg;', '°' );
        }

        // console.log( 'newWeatherData.icon', newWeatherData.icon );

        setWeatherData( newWeatherData );
      }

    } catch (error) {

      // console.error( error );

    } finally {

      setTimeout( () => setWeather( newWeatherData ), 300000 );

    }

  }

  const setGreeting = async ( greetingData ) => {
 
    setIsGreetingInitialized( true );

    // console.log( 'setGreeting' );

    let newGreetingData = {...greetingData};

    try {

      const response = await fetch( apiBaseUrl + '/index.php?action=greetingUpdate' );
      const json = await response.json();

      if ( greetingData.html !== json.html ) {

        newGreetingData.html = json.html;

        const hasIcon = json.html.indexOf( '<svg' );
        // console.log( json.html );
        if ( -1 !== hasIcon ) {
          // console.log( 'hasIcon', hasIcon );
          // console.log( json.html.substring( hasIcon ) );
          const hasIconEnd = json.html.substring( hasIcon ).indexOf( '</svg>' );
          if ( -1 !== hasIconEnd ) {
            // console.log( 'hasIconEnd', hasIconEnd );
            // console.log( json.html.substring( hasIcon ).substring( 0, hasIconEnd + 6 ) );
            newGreetingData.icon = json.html.substring( hasIcon ).substring( 0, hasIconEnd + 6 ).replace(/ ((style)|(fill)|(id))="[^"]+"/g, '').replace(/^<svg/, '<svg fill="#fff" width="30" height="30"').trim();
            newGreetingData.text = json.html.substring( hasIcon ).substring( hasIconEnd + 6 ).replace( /<[^>]+>/, '' ).trim();
          } else {
            newGreetingData.icon = false;
            newGreetingData.text = json.html.replace( /<[^>]+>/g, '' ).trim();
          }
        } else {
          newGreetingData.icon = false;
          newGreetingData.text = json.html.replace( /<[^>]+>/g, '' ).trim();
        }

        // console.log( 'newGreetingData.icon', newGreetingData.icon );

        setGreetingData( newGreetingData );
      }

    } catch (error) {

      // console.error( error );

    } finally {

      setTimeout( () => setGreeting( newGreetingData ), 300000 );

    }

  }

  useEffect( () => {

    // console.log( 'isFontsLoaded', isFontsLoaded );
    // console.log( 'isImageInitialized', isImageInitialized );
    // console.log( 'isWeatherInitialized', isWeatherInitialized );
    // console.log( 'isGreetingInitialized', isGreetingInitialized );
    // console.log( 'isAppRunning', isAppRunning );

    if ( isFontsLoaded && isImageInitialized && !isAppRunning ) {

      setIsAppRunning( true );

      setInterval( () => {
        const newTimeData = ( () => {
          const now = new Date();
          return { hours: now.getHours().toString(), minutes: now.getMinutes().toString().padStart( 2, '0' ), tick: !( now.getSeconds() % 2 ) };
        } )();
        if ( newTimeData.hours !== timeData.hours || newTimeData.minutes !== timeData.minutes ) {
          setTimeData( { hours: newTimeData.hours, minutes: newTimeData.minutes } );
        }
        setSecondTick( newTimeData.tick );
      }, 1000 );

      setScreenUnitsData( { vw: Dimensions.get( 'window' ).width / 100, vh: Dimensions.get( 'window' ).height / 100 } );
      SplashScreen.hideAsync();

    } else {

      if ( !isImageInitialized ) {
        setImage( imageData );
      }

      if ( !isWeatherInitialized ) {
        setWeather( weatherData );
      }

      if ( !isGreetingInitialized ) {
        setGreeting( greetingData );
      }

    }
  
  }, [ isFontsLoaded, isImageInitialized ] );

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
              <View style={{ ...styles.info.wrapper, right: vw( 2 ), bottom: vw( 2 ) }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: vh( 1 ) }}>
                  <Text style={{ ...styles.info.text, fontSize: vh( 12.5 ), lineHeight: vh( 12.5 ) }}>{timeData.hours}</Text>
                  <Text style={{ ...styles.info.text, fontSize: vh( 12.5 ), lineHeight: vh( 11 ), opacity: secondTick ? 1 : 0.85 }}>:</Text>
                  <Text style={{ ...styles.info.text, fontSize: vh( 12.5 ), lineHeight: vh( 12.5 ) }}>{timeData.minutes}</Text>
                </View>
                { 'string' === typeof weatherData.text &&
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  { ( 'string' === typeof weatherData.icon ) &&
                    <View width={vh(7.5)} height={vh(7.5)} style={{marginRight: vh( 1 )}}>
                      <SvgXml xml={weatherData.icon} width={vh(7.5)} height={vh(7.5)} fill="#000" opacity="0.4" />
                      <SvgXml xml={weatherData.icon} width={vh(7.5)} height={vh(7.5)} fill="#fff" style={{position: 'absolute', top: -1, left: -1, bottom: 1, right: 1 }} />
                    </View>
                  }
                  <Text style={{ ...styles.info.text, fontSize: vh( 5 ), lineHeight: vh( 5 ) }}>{weatherData.text}</Text>
                </View>
                }
                { 'string' === typeof greetingData.text &&
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  { ( 'string' === typeof greetingData.icon ) &&
                    <View width={vh(7.5)} height={vh(7.5)} style={{marginRight: vh( 1 )}}>
                      <SvgXml xml={greetingData.icon} width={vh(7.5)} height={vh(7.5)} fill="#000" opacity="0.4" />
                      <SvgXml xml={greetingData.icon} width={vh(7.5)} height={vh(7.5)} fill="#fff" style={{position: 'absolute', top: -1, left: -1, bottom: 1, right: 1 }} />
                    </View>
                  }
                  <Text style={{ ...styles.info.text, fontSize: vh( 5 ), lineHeight: vh( 5 ) }}>{greetingData.text}</Text>
                </View>
                }
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