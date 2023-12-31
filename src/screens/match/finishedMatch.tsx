import React, {useContext, useEffect, useLayoutEffect, useState} from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ImageURISource,
  SafeAreaView,
  Alert,
  Text,
} from 'react-native';
import {IMatchNavData, MatchPlayerData} from '../../utils/interface';
import ScoreBoard from '../../components/scoreboard';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
//import {LeagueContext} from '../../context/leagueContext';
import functions from '@react-native-firebase/functions';
import {StackNavigationProp} from '@react-navigation/stack';
import EmptyState from '../../components/emptyState';
import {t} from '@lingui/macro';
import i18n from '../../utils/i18n';
import {MatchContext} from '../../context/matchContext';
import storage, {firebase} from '@react-native-firebase/storage';
import FullScreenLoading from '../../components/loading';
import ImageView from 'react-native-image-viewing';
import {ListHeading, OneLine} from '../../components/listItems';
import {ScaledSheet, verticalScale} from 'react-native-size-matters';
import {APP_COLORS, TEXT_STYLES} from '../../utils/designSystem';
import {AuthContext} from '../../context/authContext';
import {MatchStackType} from './match';
import getMatchImages from './actions/getMatchImages';
import {IconButton, MinButton} from '../../components/buttons';
import shareMatchDetails from './actions/shareMatchDetails';
import skipStatsSubmission from '../club/actions/skipStatsSubmission';
import {AppContext} from '../../context/appContext';

// type ScreenRouteProp = RouteProp<MatchStackType, 'Finished Match'>;
type ScreenNavigationProp = StackNavigationProp<
  MatchStackType,
  'Finished Match'
>;

type Props = {
  navigation: ScreenNavigationProp;
  //route: ScreenRouteProp;
};

type FinishedMatchStack = {
  Result: {
    isPlayer: boolean;
  };
  'Match Stats': undefined;
  'Player Stats': undefined;
};

export type ImageProps = ImageURISource & {
  team: string;
  name: string;
  clubId: string;
};

const Tab = createMaterialTopTabNavigator<FinishedMatchStack>();

const firFunc = functions();

export default function FinishedMatch({navigation}: Props) {
  const [loading, setLoading] = useState(false);
  const matchContext = useContext(MatchContext);
  const context = useContext(AppContext);
  const user = useContext(AuthContext);
  const uid = user.uid;

  const matchData: IMatchNavData = matchContext.match;

  const isPlayer =
    matchData.players &&
    uid in matchData.players &&
    matchData.players[uid].submitted === false;

  const isAdmin = matchContext.match.admin;

  const onSkipSubmission = async () => {
    await skipStatsSubmission(matchData.leagueId, matchData.matchId, uid);
    // Remove submitted match from context
    let foundUserMatch = context.userMatches.some(
      (match) => match.id === matchData.matchId,
    );
    if (foundUserMatch) {
      let updatedUserMatches = context.userMatches.filter(
        (match) => match.id !== matchData.matchId,
      );

      context.setUserMatches(updatedUserMatches);
    }
    navigation.goBack();
  };

  const onUndoMatch = async () => {
    setLoading(true);
    try {
      const undoMatch = firFunc.httpsCallable('undoPublishedMatch');
      await undoMatch({match: matchData});
      Alert.alert(
        i18n._(t`Match is unpublished`),
        i18n._(t`This match has been successfully unpublished`),
        [
          {
            text: i18n._(t`Close`),
            style: 'cancel',
            onPress: () => {
              setLoading(false);
              navigation.goBack();
            },
          },
        ],
        {cancelable: false},
      );
    } catch (err) {
      console.log(err);
      setLoading(false);
      throw new Error(err);
    }
  };

  const showSkipAlert = () => {
    Alert.alert(
      i18n._(t`Skip Stats Submission`),
      i18n._(
        t`You are about to skip stats submission for this match. This action can't be undone.`,
      ),
      [
        {
          text: i18n._(t`Skip Submission`),
          onPress: () => onSkipSubmission(),
          style: 'destructive',
        },
        {
          text: i18n._(t`Close`),
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  const showUndoAlert = () => {
    Alert.alert(
      i18n._(t`Reset match result`),
      i18n._(
        t`WARNING: You are about to reset result and unpublish this match`,
      ),
      [
        {
          text: i18n._(t`Reset match`),
          onPress: () => onUndoMatch(),
          style: 'destructive',
        },
        {
          text: i18n._(t`Cancel`),
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View
          style={{
            flexDirection: 'row',
          }}>
          {isPlayer && (
            <IconButton name="account-cancel" onPress={() => showSkipAlert()} />
          )}
          {isAdmin && (
            <IconButton name="undo-variant" onPress={() => showUndoAlert()} />
          )}
          {!isAdmin && (
            <IconButton
              name="message-alert-outline"
              onPress={() => shareMatchDetails(matchData)}
            />
          )}
        </View>
      ),
    });
  }, [matchContext]);

  if (loading) {
    return <FullScreenLoading visible={true} />;
  }

  return (
    <Tab.Navigator lazy={true}>
      <Tab.Screen
        name="Result"
        component={MatchResult}
        initialParams={{isPlayer: isPlayer}}
      />
      <Tab.Screen name="Match Stats" component={MatchScreenshots} />
      <Tab.Screen name="Player Stats" component={PlayerScreenshots} />
    </Tab.Navigator>
  );
}

function MatchResult({navigation, route}) {
  const [motm, setMotm] = useState<Partial<MatchPlayerData>>();
  const [goalscorers, setGoalscorers] = useState<MatchPlayerData[]>();
  const [loading, setLoading] = useState(true);

  const matchContext = useContext(MatchContext);
  const matchData: IMatchNavData = matchContext.match;

  const isPlayer = route.params.isPlayer;

  useEffect(() => {
    const getGoalscorers = () => {
      const playersData = Object.values(matchData.players);
      const matchGoalscorers = playersData.filter((player) => player.goals > 0);
      setGoalscorers(matchGoalscorers);
    };

    const getMotm = () => {
      if (matchData.motm) {
        const motmPlayerId = matchData.motm;
        const motmPlayer = matchData.players[motmPlayerId];
        // console.log(motmPlayer);
        setMotm({
          username: motmPlayer.username,
          club: motmPlayer.club,
          rating: motmPlayer.rating,
        });
      }
    };

    if (matchData.players) {
      getMotm();
      getGoalscorers();
    }

    setLoading(false);
  }, [matchData]);

  if (loading) {
    return <FullScreenLoading visible={loading} />;
  }

  return (
    <View style={{flex: 1}}>
      <ScoreBoard
        data={matchData}
        editable={false}
        showSubmit={isPlayer}
        onSubmit={() => navigation.navigate('Submit Stats')}
        submitTitle={i18n._(t`Submit Stats`)}
        // onPressHome={() => {
        //   navigation.navigate('Club Profile', {
        //     clubId: matchData.homeTeamId,
        //   });
        // }}
        // onPressAway={() => {
        //   navigation.navigate('Club Profile', {
        //     clubId: matchData.awayTeamId,
        //   });
        // }}
      />
      {
        // MOTM - Name, Club, Rating, Card
        // Goalscorers for both teams
      }
      <ScrollView>
        <View>
          <ListHeading col1={i18n._(t`Man of the Match`)} />
          <View
            style={{
              padding: verticalScale(16),
            }}>
            {motm ? (
              <>
                <View
                  style={{
                    paddingBottom: verticalScale(16),
                  }}>
                  <Text style={TEXT_STYLES.caption}>{i18n._(t`Player`)}</Text>
                  <Text
                    style={[
                      TEXT_STYLES.display4,
                      {
                        color: APP_COLORS.Accent,
                      },
                    ]}>
                    {motm.username}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                  }}>
                  <View
                    style={{
                      paddingRight: verticalScale(48),
                    }}>
                    <Text style={TEXT_STYLES.caption}>{i18n._(t`Club`)}</Text>
                    <Text style={TEXT_STYLES.display5}>{motm.club}</Text>
                  </View>
                  {motm.rating && (
                    <View>
                      <Text style={TEXT_STYLES.caption}>
                        {i18n._(t`Rating`)}
                      </Text>
                      <Text style={TEXT_STYLES.display5}>{motm.rating}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <EmptyState title={i18n._(t`No MOTM`)} />
            )}
          </View>
        </View>
        <View>
          <ListHeading
            col1={i18n._(t`${matchData.homeTeamName} goalscorers`)}
            col4={i18n._(t`Goals`)}
          />
          {goalscorers?.some(
            (player) => player.clubId === matchData.homeTeamId,
          ) ? (
            goalscorers.map(
              (player, index) =>
                player.clubId === matchData.homeTeamId && (
                  <OneLine
                    title={player.username}
                    key2={player.goals}
                    key={index}
                  />
                ),
            )
          ) : (
            <EmptyState body={i18n._(t`No goalscorers`)} />
          )}
        </View>
        <View>
          <ListHeading
            col1={i18n._(t`${matchData.awayTeamName} goalscorers`)}
            col4={i18n._(t`Goals`)}
          />
          {goalscorers?.some(
            (player) => player.clubId === matchData.awayTeamId,
          ) ? (
            goalscorers.map(
              (player, index) =>
                player.clubId === matchData.awayTeamId && (
                  <OneLine
                    title={player.username}
                    key2={player.goals}
                    key={index}
                  />
                ),
            )
          ) : (
            <EmptyState body={i18n._(t`No goalscorers`)} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MatchScreenshots() {
  const [matchImages, setMatchImages] = useState<Array<ImageProps>>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const matchContext = useContext(MatchContext);
  const matchData: IMatchNavData = matchContext.match;

  const windowWidth = useWindowDimensions().width;
  // const windowHeight = useWindowDimensions().height;

  useEffect(() => {
    const getImages = async () => {
      let screenshotBucket = firebase.app().storage('gs://prz-screen-shots');
      if (__DEV__) {
        screenshotBucket = storage();
      }
      const homeRef = screenshotBucket.ref(
        `/${matchData.leagueId}/${matchData.matchId}/${matchData.homeTeamId}/facts`,
      );
      const awayRef = screenshotBucket.ref(
        `/${matchData.leagueId}/${matchData.matchId}/${matchData.awayTeamId}/facts`,
      );
      const [homeImageUrls, awayImageUrls] = await getMatchImages(
        homeRef,
        awayRef,
        matchData.homeTeamId,
        matchData.awayTeamId,
      );
      setMatchImages([...homeImageUrls, ...awayImageUrls]);
      setLoading(false);
    };

    try {
      getImages();
    } catch (error) {
      console.log('error getting images');
    }
  }, [matchData]);

  const MatchImage = ({uri, index}: {uri: string; index: number}) => (
    <Pressable
      onPress={() => {
        setCurrentImage(index);
        setImageViewerVisible(true);
      }}>
      <Image
        source={{
          uri: uri,
        }}
        style={{
          height: verticalScale(100),
          width: windowWidth / 3,
          borderWidth: 3,
          borderColor: APP_COLORS.Dark,
        }}
      />
    </Pressable>
  );

  return (
    <ScrollView style={{flex: 1}}>
      <FullScreenLoading visible={loading} />
      <ImageView
        images={matchImages}
        imageIndex={currentImage}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
      <ListHeading col1={matchData.homeTeamName} />
      <View style={styles.gallery}>
        {matchImages.some((image) => image.team === 'home') ? (
          matchImages.map(
            (image, index) =>
              image.team === 'home' && (
                <MatchImage uri={image.uri} index={index} key={index} />
              ),
          )
        ) : (
          <EmptyState
            body={i18n._(t`Manager uploaded no images`)}
            title={i18n._(t`No screenshots`)}
          />
        )}
      </View>
      <ListHeading col1={matchData.awayTeamName} />
      <View style={styles.gallery}>
        {matchImages.some((image) => image.team === 'away') ? (
          matchImages.map(
            (image, index) =>
              image.team === 'away' && (
                <MatchImage uri={image.uri} index={index} key={index} />
              ),
          )
        ) : (
          <EmptyState
            body={i18n._(t`Manager uploaded no images`)}
            title={i18n._(t`No screenshots`)}
          />
        )}
      </View>
    </ScrollView>
  );
}

function PlayerScreenshots({navigation}: Props) {
  const [matchImages, setMatchImages] = useState<Array<ImageProps>>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const matchContext = useContext(MatchContext);
  const matchData: IMatchNavData = matchContext.match;

  const windowWidth = useWindowDimensions().width;
  // const windowHeight = useWindowDimensions().height;

  useEffect(() => {
    const getImages = async () => {
      let screenshotBucket = firebase.app().storage('gs://prz-screen-shots');
      if (__DEV__) {
        screenshotBucket = storage();
      }
      const homeRef = screenshotBucket.ref(
        `/${matchData.leagueId}/${matchData.matchId}/${matchData.homeTeamId}/performance`,
      );
      const awayRef = screenshotBucket.ref(
        `/${matchData.leagueId}/${matchData.matchId}/${matchData.awayTeamId}/performance`,
      );
      const [homeImageUrls, awayImageUrls] = await getMatchImages(
        homeRef,
        awayRef,
        matchData.homeTeamId,
        matchData.awayTeamId,
      );

      setMatchImages([...homeImageUrls, ...awayImageUrls]);
      setLoading(false);
    };

    try {
      getImages();
    } catch (error) {
      console.log('error getting images');
    }
  }, []);

  const showResultAlert = (title: any, body: any) => {
    console.log('alert shown');

    Alert.alert(
      title,
      body,
      [
        {
          text: i18n._(t`Close`),
          onPress: () => {
            setLoading(false);
            navigation.popToTop();
          },
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  const showConfirmationAlert = (matchImage: ImageProps) => {
    Alert.alert(
      i18n._(t`Removing player stats`),
      i18n._(
        t`Are you sure you want to remove player stats submission for this match?`,
      ),
      [
        {
          text: i18n._(t`Remove`),
          style: 'destructive',
          onPress: () =>
            onRemovePlayerSubmission(matchImage.name, matchImage.clubId),
        },
        {
          text: i18n._(t`Close`),
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  const onRemovePlayerSubmission = async (playerID: string, clubID: string) => {
    console.log('club id from image', clubID);
    setImageViewerVisible(false);
    // setLoading(true);
    try {
      // console.log('start removing');

      const removeSubmission = firFunc.httpsCallable('removeSubmission');
      await removeSubmission({
        leagueID: matchData.leagueId,
        matchID: matchData.matchId,
        clubID: clubID,
        playerID: playerID,
      });
      //   console.log('finished removing');

      showResultAlert(
        i18n._(t`Submission Removed`),
        i18n._(
          t`Player performance stats submission for this match was removed`,
        ),
      );
      //setLoading(false);
      // navigation.popToTop();
    } catch (error) {
      console.log(error);

      showResultAlert(i18n._(t`Something went wrong`), error);
    }
  };

  const MatchImage = ({uri, index}: {uri: string; index: number}) => (
    <Pressable
      onPress={() => {
        setCurrentImage(index);
        setImageViewerVisible(true);
      }}>
      <Image
        source={{
          uri: uri,
        }}
        style={{
          height: verticalScale(100),
          width: windowWidth / 3,
          borderWidth: 3,
          borderColor: APP_COLORS.Dark,
        }}
      />
    </Pressable>
  );

  const RemoveStatButton = ({image}: {image: {imageIndex: number}}) => (
    <SafeAreaView>
      <MinButton
        title={i18n._(t`Remove Player Stat`)}
        onPress={() => showConfirmationAlert(matchImages[image.imageIndex])}
      />
    </SafeAreaView>
  );

  return (
    <ScrollView style={{flex: 1}}>
      <FullScreenLoading visible={loading} />
      <ImageView
        images={matchImages}
        imageIndex={currentImage}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        FooterComponent={(image) =>
          matchData.admin ? <RemoveStatButton image={image} /> : null
        }
      />
      <ListHeading col1={matchData.homeTeamName} />
      <View style={styles.gallery}>
        {matchImages.some((image) => image.team === 'home') ? (
          matchImages.map(
            (image, index) =>
              image.team === 'home' && (
                <MatchImage uri={image.uri} index={index} key={index} />
              ),
          )
        ) : (
          <EmptyState
            body={i18n._(t`Players uploaded no images`)}
            title={i18n._(t`No screenshots`)}
          />
        )}
      </View>
      <ListHeading col1={matchData.awayTeamName} />
      <View style={styles.gallery}>
        {matchImages.some((image) => image.team === 'away') ? (
          matchImages.map(
            (image, index) =>
              image.team === 'away' && (
                <MatchImage uri={image.uri} index={index} key={index} />
              ),
          )
        ) : (
          <EmptyState
            body={i18n._(t`Players uploaded no images`)}
            title={i18n._(t`No screenshots`)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = ScaledSheet.create({
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
