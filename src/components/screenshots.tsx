import React from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  ImageBackground,
  Modal,
  Pressable,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import {APP_COLORS, TEXT_STYLES} from '../utils/designSystem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {verticalScale, ScaledSheet} from 'react-native-size-matters';
import {PrimaryButton} from './buttons';

type ThumbnailProps = {
  images: ImageSourcePropType[];
  thumbsCount: number;
  onUpload: () => void;
  onRemove: (index: number) => void;
  onZoom: (index: number) => void;
};

export default function ScreenshotUploader({
  onUpload,
  images,
  multiple,
  thumbsCount,
  onRemove,
  onZoom,
}: ThumbnailProps & {
  multiple: boolean;
}) {
  return (
    <View>
      {/* {thumbs === 'single'
        ? renderSingle()
        : renderMultiple()} */}
      <MultipleThumbs
        onUpload={onUpload}
        images={images}
        thumbsCount={thumbsCount}
        onRemove={onRemove}
        onZoom={onZoom}
      />
    </View>
  );
}

function MultipleThumbs({
  onUpload,
  images,
  thumbsCount,
  onRemove,
  onZoom,
}: ThumbnailProps) {
  //   const showDefaultThumbs = (number, upload) => {
  //     var i = 0;
  //     var output = [];
  //     while (i < number) {
  //       output.push(<Thumbnail key={String(i)} onPressUpload={upload} />);
  //       i++;
  //     }
  //     return output;
  //   };

  //   const showThumbs = () => {
  //     return images.map((item, index) => {
  //       console.log(item);
  //       return (
  //         <Thumbnail
  //           key={index}
  //           onPressRemove={() => onPressRemove(index)}
  //           onPressZoom={() => openZoomModal(index)}
  //           onPressUpload={onPressUpload}
  //           source={{uri: item.fbUrl}}
  //         />
  //       );
  //     });
  //   };

  let emptyThumbsIndex = 0;
  let uploadedThumbsIndex = 0;
  const emptyThumbs = [];
  const uploadedThumbs = [];
  while (emptyThumbsIndex < thumbsCount - images.length) {
    emptyThumbs.push(
      <Thumbnail
        key={emptyThumbsIndex}
        onUpload={onUpload}
        index={emptyThumbsIndex}
      />,
    );
    emptyThumbsIndex++;
  }
  while (uploadedThumbsIndex < images.length) {
    uploadedThumbs.push(
      <Thumbnail
        key={uploadedThumbsIndex}
        index={uploadedThumbsIndex}
        source={images[uploadedThumbsIndex]}
        onRemove={onRemove}
        onZoom={onZoom}
      />,
    );
    uploadedThumbsIndex++;
  }

  return (
    <View style={styles.uploader}>
      <View
        style={{
          paddingBottom: verticalScale(16),
        }}>
        <Text
          style={[
            TEXT_STYLES.display5,
            {
              alignSelf: 'center',
            },
          ]}>
          Upload Screenshots
          {
            //title ? title.toUpperCase() : null
          }
        </Text>
      </View>
      <View>
        {
          //images && images.length > 0 ? (
          <View style={styles.thumbsContainer}>
            {uploadedThumbs}
            {emptyThumbs}
          </View>
          // ) : (
          //   <View
          //     style={{
          //       alignItems: 'center',
          //     }}>
          //     <PrimaryButton title={buttonLabel} onPress={onPressUpload} />
          //   </View>
          // )}
        }
      </View>
      {/* {renderInfo()}
      {renderAltButton()} */}
    </View>
  );
}

//---------- Thumbnail ----------//

function Thumbnail({
  source,
  onZoom,
  onRemove,
  onUpload,
  index,
}: ThumbnailProps & {
  source?: ImageSourcePropType;
  index: number;
}) {
  return (
    <View style={styles.thumbSize}>
      {source ? (
        <ImageBackground
          source={source}
          resizeMode="cover"
          style={styles.thumbnail}>
          <View style={styles.thumbButtons}>
            <Icon
              name="magnify-plus-outline"
              size={verticalScale(24)}
              color={APP_COLORS.Light}
              onPress={() => onZoom!(index)}
            />
            <Icon
              name="delete-forever"
              size={verticalScale(24)}
              color={APP_COLORS.Light}
              onPress={() => onRemove!(index)}
            />
          </View>
        </ImageBackground>
      ) : (
        <Pressable onPress={onUpload} style={styles.emptyThumb}>
          <View>
            <Icon
              name="upload"
              size={verticalScale(32)}
              color={APP_COLORS.Gray}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = ScaledSheet.create({
  uploader: {
    backgroundColor: APP_COLORS.Secondary,
    paddingVertical: '16@vs',
  },
  thumbSize: {
    height: '104@vs',
    width: '88@vs',
  },
  emptyThumb: {
    borderWidth: '2@vs',
    borderRadius: '2@vs',
    flex: 1,
    borderStyle: Platform.OS === 'ios' ? 'dashed' : 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: APP_COLORS.Primary,
  },
  thumbsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  thumbnail: {
    flex: 1,
    width: undefined,
    height: undefined,
    justifyContent: 'flex-end',
  },
  thumbButtons: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '4@vs',
    height: '32@vs',
    alignItems: 'center',
  },
});
