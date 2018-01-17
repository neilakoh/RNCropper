import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Modal,
  Slider,
  Image,
  ImageEditor,
  ImageStore,
  Animated,
  PanResponder
} from 'react-native';
import PropTypes from 'prop-types';
import ImagePicker from 'react-native-image-picker';
import AspectRatio from 'image-aspect-ratio';
import DeepEqual from 'deep-equal';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/FontAwesome';

const { height, width, scale } = Dimensions.get('window');

const options = {
  title: 'Select Avatar',
  storageOptions: {
    skipBackup: true,
    path: '/data/data/com.rncropper/cache',
    waitUntilSaved: true
  },
  mediaType: 'photo',
  noData: true
};

export default class Cropper extends Component<{}> {
  constructor(props) {
    super(props);

    this.state ={
      imageData: {},
      imageEditorContainerSize: {},
      openCropper: false,
      processingImg: false,
      cropperWidthState: 0,
      cropperHeightState: 0,
      previewURI: '',
      imageSize: {},
      isVertical: false,
      isCropping: false,
      xAxis: 0,
      yAxis: 0,
      cropperTool: '',
      editorWrapper: {}
    };

    this.openCamera = this.openCamera.bind(this);
    this.continueCropping = this.continueCropping.bind(this);
    this.increaseWidth = this.increaseWidth.bind(this);
    this.increaseHeight = this.increaseHeight.bind(this);
    this.cropImage = this.cropImage.bind(this);
    this.cropState = {
      x: 0,
      y: 0,
      height: 0,
      width: 0,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(DeepEqual(nextProps, this.props) && DeepEqual(nextState, this.state)) {
      return false;
    } else {
      return true;
    }
  }

  getCoords(e) {
    this.cropState = {
      x: e.layout.x / 2,
      y: e.layout.y,
      height: e.layout.height,
      width: e.layout.width,
    };
  }

  cropImage(data, imgPath) {
    this.setState({isCropping: true});
    ImageEditor.cropImage(
      imgPath,
      data,
      (resImg)=>{
        this.setState({previewURI: resImg});
        this.setState({isCropping: false});
      },
      (err)=>{
        this.setState({isCropping: false});
        alert('Failed to crop');
        console.log('ERROR',err);
      },
    );
  }

  increaseHeight(value) {
    this.setState({
      cropperHeightState: value,
    });
  }
  increaseWidth(value) {
    this.setState({
      cropperWidthState: value,
    });
  }
  xAxis(val) {
    this.setState({xAxis: val});
  }
  yAxis(val) {
    this.setState({yAxis: val});
  }

  openCamera() {
    const {imageEditorContainerSize} = this.state;
    this.setState({
      processingImg: true,
    });

    ImagePicker.launchCamera(options, (response)  => {
      if(!response.didCancel) {
        this.setState(
          {
            imageData: {
              imagePath: response.path,
              imageUri: response.uri,
              imageBase64: response.data,
              imageWidth: response.width,
              imageHeight: response.height,
              orientation: response.originalRotation
            },
            openCropper: true,
            processingImg: false,
          }
        );

        Image.getSize('file://'+response.path,(imgWidth, imgHeight)=>{
          this.setState({
            imageSize :{
              height: imgHeight,
              width: imgWidth,
            },
            isVertical: imgHeight > imgWidth ? true : false,
          });
        }, (err)=>{
          console.log(err);
        });

      } else {
        this.setState({
          processingImg: false,
        });
      }

    });
  }

  loading(processingImg, message) {
    if(processingImg) {
      return (
        <View style={styles.loading}>
          <View style={styles.loadingWrapper}>
            <Text style={styles.loadingTxt}>loading</Text>
          </View>
        </View>
      )
    }
  }

  continueCropping() {
    this.setState({openCropper: true});
  }

  getImageDisplaySize(imageData, imageEditorContainerSize) {
    // if(imageData.isVertical) {
    //   return {
    //     height: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
    //     width: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    //   };
    // } else {
    //   return {
    //     height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
    //     width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    //   };
    // }
    return {
      height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
      width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    };
  }

  getInitCropCoords(imageData, imageEditorContainerSize, isVertical) {
    if(isVertical) {
      const getX = (imageEditorContainerSize.width - this.getImageDisplaySize(imageData, imageEditorContainerSize).width) / 2;
      return {
        x: getX,
        y: 0
      };
    } else {
      const getY = (imageEditorContainerSize.height - this.getImageDisplaySize(imageData, imageEditorContainerSize).height) / 2;
      return {
        x: 0,
        y: getY
      };
    }
  }

  getSliderMaxSize(imageData, imageEditorContainerSize) {
    // if(imageData.isVertical) {
    //   return {
    //     height: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
    //     width: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).width
    //   };
    // } else {
    //   return {
    //     height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
    //     width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    //   };
    // }
    return {
      height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
      width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    };
  }

  getImagePostion(e, imageData, cropperHeightState, imageEditorContainerSize) {
    this.imagePosition = {
      x: e.layout.x,
      y: e.layout.y,
      height: e.layout.height,
      width: e.layout.width,
    };

    this.setState({
      xAxis: (AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width - (cropperHeightState - e.layout.x)) / 2,
      yAxis: (AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height - (cropperHeightState - this.imagePosition.y)) / 2,
    });
  }

  positionComp(imageData, imageEditorContainerSize, cropperWidthState, cropperHeightState, isVertical, cropRatioWidth) {
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Left/Right:</Text>
          <Icon name="arrows-h" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width - (cropperWidthState - this.imagePosition.x)}
          minimumValue={isVertical ? this.imagePosition.x < 1 ? 1 : this.imagePosition.x : this.imagePosition.y < 1 ? 1 : this.imagePosition.y}
          onValueChange={(res)=>{
            this.xAxis(res);
          }}
          style={{
            padding: 10,
          }}
          value={cropperWidthState > 0 ? cropperWidthState : (AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width - (cropperWidthState - this.imagePosition.x)) / 2}
        />

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Top/Bottom:</Text>
          <Icon name="arrows-v" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height - (cropperHeightState - this.imagePosition.y)}
          minimumValue={isVertical ? this.imagePosition.y < 1 ? 1 : this.imagePosition.y : this.imagePosition.x < 1 ? 1 : this.imagePosition.x}
          onValueChange={(res)=>{
            this.yAxis(res);
          }}
          style={{
            padding: 10,
          }}
          value={cropperHeightState > 0 ? cropperHeightState : (AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height - (cropperHeightState - this.imagePosition.y)) / 2}
        />
      </View>
    )
  }
  resizeComp(imageData, imageEditorContainerSize, cropperWidthState, cropperHeightState, xAxis) {
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Width:</Text>
          <Icon name="arrows-h" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize).width}
          minimumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize).width - (this.getSliderMaxSize(imageData, imageEditorContainerSize).width - 64)}
          onValueChange={(res)=>{
            this.increaseWidth(res);
          }}
          style={{
            padding: 10,
          }}
          value={cropperWidthState}
        />

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Height:</Text>
          <Icon name="arrows-v" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize).height}
          minimumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize).height - (this.getSliderMaxSize(imageData, imageEditorContainerSize).height - 64)}
          onValueChange={(res)=>{
            this.increaseHeight(res);
          }}
          style={{
            padding: 10,
          }}
          value={cropperHeightState}
        />
      </View>
    )
  }

  CropContainer(
    imageData,
    cropRatioWidth,
    cropRatioHeight,
    imageEditorContainerSize,
    cropperWidthState,
    cropperHeightState,
    previewURI,
    imageSize,
    isVertical,
    isCropping,
    cropperTool,
    xAxis,
    yAxis,
    editorWrapper
  ) {
    const preview = "data:image/jpeg;base64,"+previewURI;
    const imageRatioSize = {
      height: AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
      width: AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    };

    // console.log('cropwidth',cropperWidthState);
    console.log('position',xAxis);
    // console.log(xAxis + cropperWidthState);

    return (
      <View style={{
        backgroundColor: '#000000',
        width: width,
        flex: 1,
      }} onLayout={(e)=>{
        this.setState({
          editorWrapper: e.nativeEvent.layout,
        });
      }}>
        <View style={{
          flex: 1,
          width: width,
          justifyContent: 'center',
          alignItems: 'center',
        }} onLayout={(e)=>{
          this.setState({
            imageEditorContainerSize: e.nativeEvent.layout,
            cropperWidthState: this.getSliderMaxSize(imageData, e.nativeEvent.layout).width - (this.getSliderMaxSize(imageData, e.nativeEvent.layout).width - 64),
            cropperHeightState: this.getSliderMaxSize(imageData, e.nativeEvent.layout).height - (this.getSliderMaxSize(imageData, e.nativeEvent.layout).height - 64),
          });
        }}>

          {
            Object.keys(imageData).length > 0 && cropRatioWidth && cropRatioHeight && Object.keys(imageEditorContainerSize).length > 0 && Object.keys(imageSize).length > 0 ?
            (
              <View onLayout={(e)=>{this.getImagePostion(e.nativeEvent, imageData, cropperHeightState, imageEditorContainerSize)}}>
                <Image source={{uri: imageData.imageUri}} resizeMode='contain' ref='editImage' style={{
                  width: this.getImageDisplaySize(imageData, imageEditorContainerSize).width,
                  height: this.getImageDisplaySize(imageData, imageEditorContainerSize).height
                }}/>
              </View>
            )
            :
            <Text style={{color: '#ffffff'}}>Loading Image</Text>
          }

          {
            Object.keys(imageEditorContainerSize).length > 0 && xAxis !== 0 && yAxis !== 0 ?
              <View
                ref='cropFrame'
                style={{
                  height: cropperHeightState,
                  width: cropperWidthState,
                  borderColor: 'red',
                  borderWidth: 1,
                  position: 'absolute',
                  top: yAxis,
                  left: xAxis,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
                onLayout={(e)=>{this.getCoords(e.nativeEvent)}}
              />
            :
            null
          }

          <View style={{
            height: 150,
            width: 150,
            backgroundColor: 'rgba(0,0,0,0.8)',
            position: 'absolute',
            bottom: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}>
            {
              previewURI !== '' ?
                <Image source={{uri: previewURI}} resizeMode='contain' style={{
                  height: 150,
                  width: 150,
                  backgroundColor: 'gray'
                }}/>
              :
              null
            }
          </View>

        </View>


        <View style={{
          height: height * .10,
          width: width,
          padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          <TouchableOpacity style={{
            backgroundColor: '#000000',
            width: width * .25,
            justifyContent: 'center',
            alignItems: 'center'
          }} onPress={()=>{
            this.setState({
              cropperTool: 'move'
            });
          }}>
            <View>
              <Icon name="arrows" size={50} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{
            flex: 1,
            backgroundColor: '#000000',
            width: width * .50,
            justifyContent: 'center',
            alignItems: 'center'
          }} onPress={isCropping ? null : ()=>{this.cropImage(
            {
              offset: {
                x: (xAxis - this.imagePosition.x) * cropRatioWidth,  //(xAxis - 16) * cropRatioWidth
                y: (yAxis - this.imagePosition.y) * cropRatioHeight,
              },
              size: {
                width: isVertical ? cropperWidthState * cropRatioWidth : cropperWidthState * cropRatioWidth,
                height: isVertical ? cropperHeightState * cropRatioHeight : cropperHeightState * cropRatioHeight,
              },
              displaySize: {
                width: isVertical ? cropperWidthState * cropRatioWidth : cropperWidthState * cropRatioWidth,
                height: isVertical ? cropperHeightState * cropRatioHeight : cropperHeightState * cropRatioHeight,
              },
              resizeMode: 'contain'
            },
            'file://'+imageData.imagePath
          )}}>
            <View>
              <Icon name="crop" size={50} color="#FFFFFF"/>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: '#000000',
            width: width * .25,
            justifyContent: 'center',
            alignItems: 'center'
          }} onPress={()=>{
            this.setState({
              cropperTool: 'resize'
            });
          }}>
            <View>
              <Icon name="arrows-alt" size={50} color="#FFFFFF"/>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{
          height: height * .20,
          width: width,
          padding: 10,
          justifyContent: 'center'
        }}>
        {
          cropperTool === 'resize' ? this.resizeComp(imageData, imageEditorContainerSize, cropperWidthState, cropperHeightState, xAxis) : cropperTool === 'move' ? this.positionComp(imageData, imageEditorContainerSize, cropperWidthState, cropperHeightState, isVertical, cropRatioWidth) : null
        }
        </View>
      </View>
    )
  }

  isObjectEmpty(value) {
    if(typeof(value) !== 'object') {
      return 'Please pass and object';
    }
    if(Object.keys(value).length > 0) {
      return true;
    } else {
      return false;
    }
  }

  customModal(
    show,
    imageData,
    cropRatioWidth,
    cropRatioHeight,
    imageEditorContainerSize,
    cropperWidthState,
    cropperHeightState,
    previewURI,
    imageSize,
    isVertical,
    isCropping,
    cropperTool,
    xAxis,
    yAxis,
    editorWrapper
  ) {
    if(show) {
      return (
        <View style={{
          width: width,
          flex: 1,
          backgroundColor: '#000000',
          position: 'absolute',
          height: height,
          zIndex: 5
        }}>
        {
          this.CropContainer(
            imageData,
            cropRatioWidth,
            cropRatioHeight,
            imageEditorContainerSize,
            cropperWidthState,
            cropperHeightState,
            previewURI,
            imageSize,
            isVertical,
            isCropping,
            cropperTool,
            xAxis,
            yAxis,
            editorWrapper
          )
        }
        </View>
      )
    }
  }

  render() {
    const { btnName, bgColor, textColor } = this.props;
    const { imageData, openCropper, processingImg, imageEditorContainerSize, cropperWidthState, cropperHeightState, previewURI,  imageSize, isVertical, isCropping, cropperTool, xAxis, yAxis, editorWrapper } = this.state;

    const cropRatioWidth = this.isObjectEmpty(imageData) && this.isObjectEmpty(imageEditorContainerSize) ? imageSize.width / AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).width : null;
    const cropRatioHeight = this.isObjectEmpty(imageData) && this.isObjectEmpty(imageEditorContainerSize) ? imageSize.height / AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).height : null;

    return (
      <View style={styles.container}>

        {
          this.loading(processingImg, 'Processing Image')
        }

        {
          this.customModal(
            openCropper,
            imageData,
            cropRatioWidth,
            cropRatioHeight,
            imageEditorContainerSize,
            cropperWidthState,
            cropperHeightState,
            previewURI,
            imageSize,
            isVertical,
            isCropping,
            cropperTool,
            xAxis,
            yAxis,
            editorWrapper
          )
        }

        <TouchableOpacity style={[styles.cameraBtn, {backgroundColor: bgColor}]} activeOpacity={0.7} onPress={Object.keys(imageData).length > 0 ? ()=>{this.continueCropping()} : this.openCamera}>
          <View>
            <Text style={[styles.btnText, {color: textColor}]}>{Object.keys(imageData).length > 0 ? 'Continue Editing Image' : btnName}</Text>
          </View>
        </TouchableOpacity>
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
  cameraBtn: {
    width: width,
    height: height * .10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontWeight: 'bold'
  },
  loading: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingWrapper: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: width * .50,
    height: height * .15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  loadingTxt: {
    color: '#ffffff'
  },
  labelStyle: {
    color: '#09cbf2'
  }
});

Cropper.propTypes = {
  btnName: PropTypes.string,
  bgColor: PropTypes.string,
  textColor: PropTypes.string
}
