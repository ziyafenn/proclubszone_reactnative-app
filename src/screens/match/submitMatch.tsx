import React, {useContext, useEffect, useState, useRef} from 'react';
import {ScrollView, View, Alert, ImageURISource} from 'react-native';
import submitMatch from './functions/onSubmitMatch';
import {AppContext} from '../../context/appContext';
import {MatchStackType} from './match';
import ScoreBoard from '../../components/scoreboard';
import {MatchTextField} from '../../components/textField';
import {ScaledSheet, verticalScale} from 'react-native-size-matters';
import {APP_COLORS} from '../../utils/designSystem';
//import firestore from '@react-native-firebase/firestore';
import EmptyState from '../../components/emptyState';
import i18n from '../../utils/i18n';
import {ListHeading} from '../../components/listItems';
import {t} from '@lingui/macro';
import FullScreenLoading from '../../components/loading';
import {StackNavigationProp} from '@react-navigation/stack';
//import useGetMatches from '../league/functions/useGetMatches';
import analytics from '@react-native-firebase/analytics';
import {MatchContext} from '../../context/matchContext';
import {BigButton, MinButton} from '../../components/buttons';
import ScreenshotUploader from '../../components/screenshots';
import {launchImageLibrary} from 'react-native-image-picker';
import ImageView from 'react-native-image-viewing';
import storage, {firebase} from '@react-native-firebase/storage';
import MatchPlayer from '../../components/matchPlayer';
import {PlayerStats} from '../../utils/interface';
import Select from '../../components/select';

type ScreenNavigationProp = StackNavigationProp<MatchStackType, 'Submit Match'>;

type Props = {
  navigation: ScreenNavigationProp;
};

interface MenuPlayerItem extends PlayerStats {
  id: string;
  username: string;
}

//const db = firestore();

export default function SubmitMatch({navigation, route}: Props) {
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorStates, setErrorStates] = useState({
    homeScore: false,
    awayScore: false,
  });
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [images, setImages] = useState<ImageURISource[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [roster, setRoster] = useState<{username: string}[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{username: string}[]>(
    [],
  );
  const [expandedPlayer, setExpandedPlayer] = useState<number>();
  const [motm, setMotm] = useState<number>();

  const context = useContext(AppContext);
  const matchContext = useContext(MatchContext);

  const matchData = matchContext.match;
  const leagueId = matchData.leagueId;
  const clubId = matchData.clubId;

  const ref = useRef(null);

  console.log(ref);

  // const leagueRef = db
  //   .collection('leagues')
  //   .doc(leagueId)
  //   .collection('matches');

  // const query = leagueRef
  //   .where('homeTeamId', 'in', matchData.teams)
  //   .where('teams', 'array-contains', '')
  //   .where('published', '==', true);

  // const getMatches = useGetMatches(leagueId, query);

  useEffect(() => {
    const currentRoster = context.userLeagues[leagueId].clubs[clubId].roster;
    let rosterItems: [{}] = [];

    for (const [id, playerData] of Object.entries(currentRoster)) {
      const player = {
        id,
        username: playerData.username,
      };
      rosterItems = [...rosterItems, player];
    }
    console.log(rosterItems);
    setRoster(rosterItems);
  }, [context]);

  const showAlert = (submissionResult: string) => {
    let title: string;
    let body: string;

    let conflict: boolean = false;

    switch (submissionResult) {
      case 'Success':
        title = i18n._(t`Result Submitted`);
        body = i18n._(t`Match was published with the selected result`);
        break;
      case 'Conflict':
        title = i18n._(t`Match will be reviewed`);
        body = i18n._(t`Match cannot be published due to conflict.`);
        conflict = true;
        break;
      case 'First Submission':
        title = i18n._(t`Result Submitted`);
        body = i18n._(
          t`Match will be published once opponent submits their result`,
        );
        break;
    }

    let foundUserMatch = context.userMatches.filter(
      (match) => match.id === matchData.matchId,
    );

    if (foundUserMatch.length !== 0) {
      let notPublishedMatches = context.userMatches.filter(
        (match) => match.id !== matchData.matchId,
      );

      if (submissionResult === 'Success') {
        context.setUserMatches(notPublishedMatches);
      }
      if (
        submissionResult === 'First Submission' ||
        submissionResult === 'Conflict'
      ) {
        let userUpcomingMatch = {...foundUserMatch[0]};
        userUpcomingMatch.data.conflict = conflict;
        userUpcomingMatch.data.submissions = {
          [matchData.clubId]: {
            [matchData.homeTeamId]: Number(homeScore),
            [matchData.awayTeamId]: Number(awayScore),
          },
        };
        const updatedMatchList = [userUpcomingMatch, ...notPublishedMatches];
        context.setUserMatches(updatedMatchList);
      }
    }

    // const popAction = StackActions.popToTop();

    Alert.alert(
      title,
      body,
      [
        {
          text: i18n._(t`Close`),
          onPress: () => {
            setLoading(false);
            navigation.popToTop();
            navigation.goBack();
          },
        },
      ],
      {cancelable: false},
    );
  };

  const fieldValidation = async (): Promise<boolean> => {
    const regex = new RegExp('^[0-9]*$');

    if (!regex.test(homeScore) || !regex.test(awayScore)) {
      setErrorStates({
        awayScore: !regex.test(awayScore),
        homeScore: !regex.test(homeScore),
      });
      return false;
    }

    if (!homeScore || !awayScore) {
      setErrorStates({awayScore: !awayScore, homeScore: !homeScore});
      return false;
    }

    return true;
  };

  const onChangeText = (text: string, field: 'homeScore' | 'awayScore') => {
    switch (field) {
      case 'homeScore':
        setHomeScore(text);
        break;
      case 'awayScore':
        setAwayScore(text);
        break;
    }

    if (errorStates[field]) {
      setErrorStates({...errorStates, [field]: false});
    }
  };

  const uploadScreenshots = async () => {
    for (const [index, image] of images.entries()) {
      let screenshotBucket = firebase.app().storage('gs://prz-screen-shots');
      if (__DEV__) {
        screenshotBucket = storage();
      }
      const reference = screenshotBucket.ref(
        `/${matchData.leagueId}/${matchData.matchId}/${matchData.clubId}/facts/${imageNames[index]}`,
      );
      const pathToFile = image.uri;
      const task = reference.putFile(pathToFile);
      await task.then(() => console.log('image uploaded'));
    }
  };

  const onSubmitMatch = async () => {
    fieldValidation().then(async (noErrors) => {
      if (noErrors) {
        setLoading(true);
        await uploadScreenshots()
          .then(
            async () =>
              await submitMatch(homeScore, awayScore, matchData).then(
                async (result) => {
                  await analytics().logEvent('match_submit_score');
                  showAlert(result);
                },
              ),
          )
          .catch((err) => {
            console.log('something wrong with uploading', err);
            setLoading(false);
          });
      }
    });
  };

  const onRemoveThumb = (seletectedThumbIndex: number) => {
    const updatedImages = images.filter(
      (image, i) => i !== seletectedThumbIndex,
    );
    setImages(updatedImages);
  };

  return (
    <>
      <FullScreenLoading
        visible={loading}
        label={i18n._(t`Submitting Match...`)}
      />
      <ImageView
        images={images}
        imageIndex={currentImage}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
      <Select
        visible={selectVisible}
        displayKey="username"
        submitButtonText="Submit"
        uniqueKey="id"
        items={roster}
        onClose={() => setSelectVisible(false)}
        ref={ref}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}>
        <ScoreBoard data={matchData} editable={true} showSubmit={false}>
          <MatchTextField
            error={errorStates.homeScore}
            onChangeText={(score: string) => onChangeText(score, 'homeScore')}
            value={homeScore}
          />
          <View style={styles.divider} />
          <MatchTextField
            error={errorStates.awayScore}
            onChangeText={(score: string) => onChangeText(score, 'awayScore')}
            value={awayScore}
          />
        </ScoreBoard>

        <ScreenshotUploader
          thumbsCount={3}
          images={images}
          multiple={true}
          onZoom={(i) => {
            setCurrentImage(i);
            setImageViewerVisible(true);
          }}
          onRemove={(i) => onRemoveThumb(i)}
          onUpload={() =>
            launchImageLibrary(
              {
                mediaType: 'photo',
                maxWidth: 1920,
                maxHeight: 1280,
              },
              (res) => {
                if (res.uri) {
                  setImages([...images, {uri: res.uri}]);
                  setImageNames([...imageNames, res.fileName!]);
                  console.log(res);
                }
              },
            )
          }
        />
        <ListHeading col1="Participated Players" />
        <View
          style={{
            padding: verticalScale(8),
            paddingBottom: verticalScale(32),
            flexGrow: 1,
          }}>
          {roster.map((player, i) => (
            <MatchPlayer
              username={player.username}
              key={i}
              motm={motm === i}
              onMotm={() => (motm === i ? setMotm(null) : setMotm(i))}
              onExpand={() =>
                expandedPlayer === i
                  ? setExpandedPlayer(null)
                  : setExpandedPlayer(i)
              }
              expanded={expandedPlayer === i}
            />
          ))}
          <MinButton
            title="add players"
            onPress={() => ref?.current?._toggleSelector()}
          />
        </View>
        <BigButton title={i18n._(t`Submit Match`)} onPress={onSubmitMatch} />
      </ScrollView>
    </>
  );
}

const styles = ScaledSheet.create({
  divider: {
    height: '3@vs',
    width: '8@vs',
    backgroundColor: APP_COLORS.Accent,
    marginHorizontal: '8@vs',
  },
});
