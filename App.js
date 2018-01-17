/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Cropper from './cropper/index';

export default class App extends Component<{}> {
  render() {
    return (
      <View style={styles.container}>
        <Cropper
          btnName='Take a photo'
          bgColor='#04a0d8'
          textColor='#ffffff'
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
