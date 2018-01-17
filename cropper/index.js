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

const { height, width } = Dimensions.get('window');

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

    this.state = {
      imageData: {},
      imageSize: {},
      imageEditorContainerSize: {},
      cropperWidth: 0,
      cropperHeight: 0,
      cropperLocationX: 0,
      cropperLocationY: 0,
      tool: 'preview',
      cropPreview: '',
      openCropper: false,
      processingImg: false,
      isCropping: false,
      isVertical: null,
      initCropperInfo: {},
      imagePosition: {}
    };

    this.openCamera = this.openCamera.bind(this);
    this.continueCropping = this.continueCropping.bind(this);
    this.cropImage = this.cropImage.bind(this);
    this.xAxis = this.xAxis.bind(this);
    this.yAxis = this.yAxis.bind(this);
    this.cropSizeWidth = this.cropSizeWidth.bind(this);
    this.cropSizeHeight = this.cropSizeHeight.bind(this);
    this.getImgCropSizeDiff = null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(DeepEqual(nextProps, this.props) && DeepEqual(nextState, this.state)) {
      return false;
    } else {
      return true;
    }
  }

  cropImage(data, imgPath) {
    this.setState({isCropping: true});
    ImageEditor.cropImage(
      imgPath,
      data,
      (resImg)=>{
        this.setState({
          cropPreview: resImg,
          isCropping: false,
          tool: 'preview'
        });
      },
      (err)=>{
        this.setState({isCropping: false});
        alert('Failed to crop');
        console.log('ERROR',err);
      },
    );
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

  getImagePostion(e, imageData, imageEditorContainerSize, imageRatioSize, initCropperInfo) {
    this.setState({
      imagePosition: {
        x: e.layout.x,
        y: e.layout.y,
        height: e.layout.height,
        width: e.layout.width,
      }
    });

    this.setState({
      cropperLocationX: (imageRatioSize.width - initCropperInfo.cropperWidth ) / 2,
      cropperLocationY: (imageRatioSize.height - initCropperInfo.cropperHeight ) / 2,
    });
  }

  continueCropping() {
    this.setState({openCropper: true});
  }

  openCamera() {
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

  customModal(
    imageData,
    imageSize,
    imageEditorContainerSize,
    cropperWidth,
    cropperHeight,
    cropperLocationX,
    cropperLocationY,
    tool,
    cropPreview,
    openCropper,
    processingImg,
    isCropping,
    isVertical,
    initCropperInfo,
    imagePosition,
    cropRatioWidth,
    cropRatioHeight
  ) {
    if(openCropper) {
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
            imageSize,
            imageEditorContainerSize,
            cropperWidth,
            cropperHeight,
            cropperLocationX,
            cropperLocationY,
            tool,
            cropPreview,
            processingImg,
            isCropping,
            isVertical,
            initCropperInfo,
            imagePosition,
            cropRatioWidth,
            cropRatioHeight
          )
        }
        </View>
      );
    }
  }

  renderCropper(
    initCropperInfo,
    imagePosition,
    cropperLocationX,
    cropperLocationY,
    cropperWidth,
    cropperHeight
  ) {
    if(Object.keys(initCropperInfo).length > 0 && Object.keys(imagePosition).length > 0 && cropperLocationX > 0 && cropperLocationY > 0) {
      return (
        <View
          ref='cropFrame'
          style={{
            height: cropperHeight,
            width: cropperWidth,
            borderColor: '#ffffff',
            borderWidth: 1,
            position: 'absolute',
            top: cropperLocationY,
            left: cropperLocationX,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          // onLayout={(e)=>{this.getCoords(e.nativeEvent)}}
        >
          <View style={{
            position: 'absolute',
            height: initCropperInfo.cropperHeight * .10,
            width: initCropperInfo.cropperHeight * .10,
            margin: 5,
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderColor: 'red',
            top: 0,
            left: 0,
          }} />
          <View style={{
            position: 'absolute',
            height: initCropperInfo.cropperHeight * .10,
            width: initCropperInfo.cropperHeight * .10,
            margin: 5,
            borderTopWidth: 2,
            borderRightWidth: 2,
            borderColor: 'red',
            right: 0,
            top: 0,
          }} />
          <View style={{
            position: 'absolute',
            height: initCropperInfo.cropperHeight * .10,
            width: initCropperInfo.cropperHeight * .10,
            margin: 5,
            borderBottomWidth: 2,
            borderRightWidth: 2,
            borderColor: 'red',
            right: 0,
            bottom: 0,
          }} />
          <View style={{
            position: 'absolute',
            height: initCropperInfo.cropperHeight * .10,
            width: initCropperInfo.cropperHeight * .10,
            margin: 5,
            borderBottomWidth: 2,
            borderLeftWidth: 2,
            borderColor: 'red',
            left: 0,
            bottom: 0,
          }} />
        </View>
      );
    }
  }

  loadImage(
    isImageDataReady,
    isImageSizeReady,
    isImageEditorContainerSizeReady,
    isInitCropperInfoReady,
    imageData,
    imageEditorContainerSize,
    imagePosition,
    initCropperInfo,
    cropperLocationX,
    cropperLocationY,
    imageRatioSize,
    tool,
    isVertical,
    cropperWidth,
    cropperHeight
  ) {
    if(isImageDataReady && isImageSizeReady && isImageEditorContainerSizeReady && isInitCropperInfoReady) {
      return (
        <View>
          <Image source={{uri: imageData.imageUri}} resizeMode='contain' ref='editImage' style={{
            width: this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).width,
            height: this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).height
          }} onLayout={(e)=>{this.getImagePostion(e.nativeEvent, imageData, imageEditorContainerSize, imageRatioSize, initCropperInfo)}} />

          {
            this.renderCropper(
              initCropperInfo,
              imagePosition,
              cropperLocationX,
              cropperLocationY,
              cropperWidth,
              cropperHeight
            )
          }

          {
            tool !== 'preview' ?
              <TouchableOpacity style={{
                backgroundColor: 'rgbe(rgba(63, 178, 226, 0.5)',
                width: width * .12,
                height: width * .12,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                right: 5,
                bottom: 5,
                borderRadius: 5,
              }} onPress={()=>{
                this.setState({
                  tool: 'preview'
                });
              }}>
                <View>
                  <Icon name="search-plus" size={40} color="rgba(0,0,0,0.75)" />
                </View>
              </TouchableOpacity>
            :
            null
          }
        </View>
      );
    } else {
      return (
        <View style={styles.loading}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            width: width * .50,
            height: height * .10,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
          }}>
            <Text style={styles.loadingTxt}>Preparing Image</Text>
          </View>
        </View>
      );
    }
  }

  getSliderMaxSize(imageData, imageEditorContainerSize, isVertical) {
    if(imageData.isVertical) {
      return {
        height: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
        width: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).width
      };
    } else {
      return {
        height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
        width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
      };
    }
  }

  getImageDisplaySize(imageData, imageEditorContainerSize, isVertical) {
    if(isVertical) {
      return {
        height: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
        width: AspectRatio.calculate(imageData.imageHeight, imageData.imageWidth, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
      };
    } else {
      return {
        height: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
        width: AspectRatio.calculate(imageData.imageWidth, imageData.imageHeight, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
      };
    }
  }

  cropPreview(cropPreview) {
    return (
      <View style={{
        backgroundColor: 'transparent',
        width: height * .20,
        height: height * .20,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {
          cropPreview !== '' ?
            <Image source={{uri: cropPreview}} resizeMode='contain' style={{
              height: height * .20,
              width: height * .20,
              backgroundColor: 'transparent',
              flex: 1,
            }}/>
          :
          <Text style={{color: '#ffffff'}}>No Preview</Text>
        }
      </View>
    );
  }

  xAxis(val) {
    this.setState({cropperLocationX: val});
  }
  yAxis(val) {
    this.setState({cropperLocationY: val});
  }
  cropSizeWidth(val) {
    this.setState({cropperWidth: val});
  }
  cropSizeHeight(val) {
    this.setState({cropperHeight: val});
  }

  resizeComp(
    imageData,
    imageEditorContainerSize,
    isVertical,
    cropperWidth,
    cropperHeight,
    cropperLocationX,
    cropperLocationY
  ) {
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginTop: 10
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Width:</Text>
          <Icon name="arrows-h" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).width - cropperLocationX}
          minimumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize, isVertical).width - (this.getSliderMaxSize(imageData, imageEditorContainerSize, isVertical).width - 48)}
          onValueChange={(res)=>{
            this.cropSizeWidth(res);
          }}
          style={{
            padding: 5,
            width: width * .95,
          }}
          value={cropperWidth}
        />

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Height:</Text>
          <Icon name="arrows-v" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).height - cropperLocationY}
          minimumValue={this.getSliderMaxSize(imageData, imageEditorContainerSize, isVertical).height - (this.getSliderMaxSize(imageData, imageEditorContainerSize, isVertical).height - 48)}
          onValueChange={(res)=>{
            this.cropSizeHeight(res);
          }}
          style={{
            padding: 5,
            width: width * .95,
          }}
          value={cropperHeight}
        />
      </View>
    )
  }
  positionComp(
    imageData,
    imageEditorContainerSize,
    isVertical,
    cropperWidth,
    cropperHeight,
    cropperLocationX,
    cropperLocationY
  ) {
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginTop: 10
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Left/Right:</Text>
          <Icon name="arrows-h" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).width - cropperWidth}
          minimumValue={1}
          onValueChange={(res)=>{
            this.xAxis(res);
          }}
          style={{
            padding: 5,
            width: width * .95,
          }}
          value={cropperLocationX}
        />

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <Text style={[styles.labelStyle, {marginRight: 10}]}>Top/Bottom:</Text>
          <Icon name="arrows-v" size={20} color="#FFFFFF"/>
        </View>
        <Slider
          maximumValue={this.getImageDisplaySize(imageData, imageEditorContainerSize, isVertical).height - cropperHeight}
          minimumValue={1}
          onValueChange={(res)=>{
            this.yAxis(res);
          }}
          style={{
            padding: 5,
            width: width * .95,
          }}
          value={cropperLocationY}
        />
      </View>
    )
  }

  CropContainer(
    imageData,
    imageSize,
    imageEditorContainerSize,
    cropperWidth,
    cropperHeight,
    cropperLocationX,
    cropperLocationY,
    tool,
    cropPreview,
    processingImg,
    isCropping,
    isVertical,
    initCropperInfo,
    imagePosition,
    cropRatioWidth,
    cropRatioHeight
  ) {
    const isImageDataReady = Object.keys(imageData).length > 0 ? true : false;
    const isImageSizeReady = Object.keys(imageSize).length > 0 ? true : false;
    const isImageEditorContainerSizeReady = Object.keys(imageEditorContainerSize).length > 0 ? true : false;
    const isInitCropperInfoReady = Object.keys(initCropperInfo).length > 0 ? true : false;

    const imageRatioSize = {
      height: AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).height,
      width: AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).width,
    };

    let getEditorSideMargin = (imageEditorContainerSize.width - imagePosition.width) / 2;

    // console.log(((cropperHeight + 1) * cropRatioHeight));
    // console.log(cropRatioHeight);

    // GET THE PROPER CROPPER HEIGHT BASED ON RN IMAGE PICKER RETURNED IN VERTICAL ORIENTATION
    // STEP 1: console.log(imageRatioSize.height - cropperHeight);
    // STEP 2: console.log(cropperHeight + (imageRatioSize.height - cropperHeight));
    // STEP 3: console.log((cropperHeight + (imageRatioSize.height - cropperHeight)) * cropRatioHeight);
    // STEP 3: console.log(((cropperHeight + (imageRatioSize.height - cropperHeight)) * cropRatioHeight) - imageData.imageHeight);
    // STEP 4: console.log((((imageRatioSize.height - cropperHeight) + cropperHeight) * cropRatioHeight) - (((cropperHeight + (imageRatioSize.height - cropperHeight)) * cropRatioHeight) - imageData.imageHeight));

    // GET THE PROPER CROPPER WIDTH BASED ON RN IMAGE PICKER RETURNED IN VERTICAL ORIENTATION



    console.log('-------------------------');
    console.log('EDITOR SIZE', imageEditorContainerSize);
    console.log('IMAGE SIZE RATIO', imageRatioSize);
    console.log('IMAGE SIZE',{h: imageSize.height, w: imageSize.width});
    console.log('RAW IMAGE SIZE', {h: imageData.imageHeight, w: imageData.imageWidth});
    console.log('HEIGHT RATIO', cropRatioHeight);
    console.log({cropH: cropperHeight, cropW: cropperWidth});
    console.log({
      cropH: cropperHeight * cropRatioHeight,
      cropW: cropperWidth * cropRatioWidth
    });

    let offsetX = 0;
    let offsetY = 0;
    let sizeWidth = isVertical ? cropperHeight * cropRatioHeight : cropperWidth * cropRatioWidth;
    let sizeHeight = isVertical ? cropperWidth * cropRatioWidth : cropperHeight * cropRatioHeight;
    let displayWidth = isVertical ? cropperHeight * cropRatioHeight : cropperWidth * cropRatioWidth;
    let displayHeight = isVertical ? cropperWidth * cropRatioWidth : cropperHeight * cropRatioHeight;


    return (
      <View style={{
        backgroundColor: '#000000',
        width: width,
        flex: 1,
      }}>

        <View style={{
          flex: 1,
          width: width,
          justifyContent: 'center',
          alignItems: 'center',
        }} onLayout={(e)=>{
          this.setState({
            imageEditorContainerSize: e.nativeEvent.layout,
            cropperWidth: this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).width - (this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).width - 128),
            cropperHeight: this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).height - (this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).height - 128),
            initCropperInfo: {
              cropperWidth: this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).width - (this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).width - 128),
              cropperHeight: this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).height - (this.getSliderMaxSize(imageData, e.nativeEvent.layout, isVertical).height - 128),
            }
          });
        }}>
        {
          this.loadImage(
            isImageDataReady,
            isImageSizeReady,
            isImageEditorContainerSizeReady,
            isInitCropperInfoReady,
            imageData,
            imageEditorContainerSize,
            imagePosition,
            initCropperInfo,
            cropperLocationX,
            cropperLocationY,
            imageRatioSize,
            tool,
            isVertical,
            cropperWidth,
            cropperHeight
          )
        }
        </View>

        <View style={{
          height: height * .10,
          width: width,
          padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          <TouchableOpacity style={{
            backgroundColor: tool === 'move' ? '#40c4e5' : '#000000',
            width: width * .25,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 5
          }} onPress={()=>{
            this.setState({
              tool: 'move'
            });
          }}>
            <View>
              <Icon name="arrows" size={(width * .25) * .35} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{
            flex: 1,
            backgroundColor: tool === 'crop' ? '#40c4e5' : '#000000',
            width: width * .50,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 5
          }} onPress={isCropping ? null : ()=>{this.cropImage(
            {
              offset: {
                x: offsetX,
                y: offsetY,
              },
              size: {
                width: sizeWidth,
                height: sizeHeight
              },
              displaySize: {
                width: displayWidth,
                height: displayHeight
              },
              resizeMode: 'contain'
            },
            'file://'+imageData.imagePath
          )}}>
            <View>
              {
                isCropping ?
                  (<Text style={{color: '#ffffff'}}>Cropping...</Text>)
                :
                  (<Icon name="crop" size={(width * .25) * .35} color="#FFFFFF"/>)
              }
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{
            backgroundColor: tool === 'resize' ? '#40c4e5' : '#000000',
            width: width * .25,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 5
          }} onPress={()=>{
            this.setState({
              tool: 'resize'
            });
          }}>
            <View>
              <Icon name="arrows-alt" size={(width * .25) * .35} color="#FFFFFF"/>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{
          height: height * .20,
          width: width,
          padding: 10,
          justifyContent: 'center',
          alignItems: tool === 'preview' ? 'center' : 'flex-start'
        }}>
        {
          tool === 'resize' ? this.resizeComp(imageData, imageEditorContainerSize, isVertical, cropperWidth, cropperHeight, cropperLocationX, cropperLocationY) : tool === 'move' ? this.positionComp(imageData, imageEditorContainerSize, isVertical, cropperWidth, cropperHeight, cropperLocationX, cropperLocationY) : this.cropPreview(cropPreview)
        }
        </View>
      </View>
    );
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

  render() {
    const {
      btnName,
      bgColor,
      textColor
    } = this.props;

    const {
      imageData,
      imageSize,
      imageEditorContainerSize,
      cropperWidth,
      cropperHeight,
      cropperLocationX,
      cropperLocationY,
      tool,
      cropPreview,
      openCropper,
      processingImg,
      isCropping,
      isVertical,
      initCropperInfo,
      imagePosition
    } = this.state;

    const cropRatioWidth = this.isObjectEmpty(imageData) && this.isObjectEmpty(imageEditorContainerSize) ? imageSize.width / AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).width : null;
    const cropRatioHeight = this.isObjectEmpty(imageData) && this.isObjectEmpty(imageEditorContainerSize) ? imageSize.height / AspectRatio.calculate(imageSize.width, imageSize.height, imageEditorContainerSize.width, imageEditorContainerSize.height).height : null;

    return (
      <View style={styles.container}>
        {
          this.loading(processingImg, 'Processing Image')
        }
        {
          this.customModal(
            imageData,
            imageSize,
            imageEditorContainerSize,
            cropperWidth,
            cropperHeight,
            cropperLocationX,
            cropperLocationY,
            tool,
            cropPreview,
            openCropper,
            processingImg,
            isCropping,
            isVertical,
            initCropperInfo,
            imagePosition,
            cropRatioWidth,
            cropRatioHeight
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
