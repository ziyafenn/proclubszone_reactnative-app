import React, {useState, useContext, useCallback, useLayoutEffect} from 'react';
import {Text, View, Alert, ScrollView, Linking} from 'react-native';
import {AuthContext} from '../../context/authContext';
import {LeagueStackType} from './league';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp, CommonActions} from '@react-navigation/native';
import {LeagueContext} from '../../context/leagueContext';
import {AppContext} from '../../context/appContext';
import {useActionSheet} from '@expo/react-native-action-sheet';
import {BigButton, IconButton} from '../../components/buttons';
import {APP_COLORS, TEXT_STYLES} from '../../utils/designSystem';
import {verticalScale} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import functions from '@react-native-firebase/functions';
import FullScreenLoading from '../../components/loading';
import {t} from '@lingui/macro';
import i18n from '../../utils/i18n';
import shareLeagueLink from './actions/shareLink';
import crashlytics from '@react-native-firebase/crashlytics';

type ScreenNavigationProp = StackNavigationProp<
  LeagueStackType,
  'League Preview'
>;

type ScreenRouteProp = RouteProp<LeagueStackType, 'League Preview'>;

type Props = {
  navigation: ScreenNavigationProp;
  route: ScreenRouteProp;
};

export default function LeaguePreview({navigation, route}: Props) {
  const [joined, setJoined] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const leagueContext = useContext(LeagueContext);
  const user = useContext(AuthContext);
  const context = useContext(AppContext);
  const {showActionSheetWithOptions} = useActionSheet();

  const league = leagueContext.league;
  const leagueId = leagueContext.leagueId;
  const scheduled = league.scheduled;
  // const leagueComplete = league.acceptedClubs === league.teamNum;
  const isManager = context?.userData?.leagues?.[leagueId]?.manager;

  const infoMode = route.params?.infoMode;

  const isAdmin = Object.keys(league.admins).some(
    (adminUid) => adminUid === user.uid,
  );
  const ownerId = league.ownerId;
  const isOwner = ownerId === user.uid;

  const onDeleteLeague = () => {
    const deleteLeague = async () => {
      const deleteUserLeague = functions().httpsCallable('deleteLeague');
      await deleteUserLeague({
        leagueId,
        leagueOwnerId: ownerId,
      });
    };

    Alert.alert(
      i18n._(t`Delete League?`),
      i18n._(
        t`It is impossible to recover deleted league. After removal the app will restart`,
      ),
      [
        {
          text: 'Delete',
          onPress: () => {
            setLoading(true);
            deleteLeague().then(() => {
              // const userData = {...context.userData};
              // const userLeagues = {...context.userLeagues};
              // //  const currentLeague = {...league};
              // delete userData.leagues![leagueId];
              // delete userLeagues[leagueId];

              navigation.dispatch(
                CommonActions.reset({
                  index: 1,
                  routes: [{name: 'Home'}],
                }),
              );
              // console.log(context.userData, userData);
              // console.log(context.userLeagues);
              // context.setUserData(userData);
              //context.setUserLeagues(userLeagues);

              //setLoading(false);
            });
          },
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
    const userLeagues = context.userData?.leagues;
    const inLeague =
      typeof userLeagues !== 'undefined'
        ? userLeagues.hasOwnProperty(leagueId)
        : false;

    setJoined(inLeague);

    if (inLeague) {
      const acceptedToLeague = userLeagues[leagueId].accepted;
      setAccepted(acceptedToLeague);
    }

    setJoined(inLeague);

    navigation.setOptions({
      headerRight: () => (
        <View
          style={{
            flexDirection: 'row',
          }}>
          <IconButton
            name="share-variant"
            onPress={() => {
              shareLeagueLink(league.name, leagueId);
            }}
          />
          {!isAdmin && inLeague && isManager && (
            <IconButton
              name="account-group"
              onPress={() =>
                navigation.navigate('My Club', {
                  clubId: context.userData.leagues[leagueId].clubId,
                })
              }
            />
          )}
          {isOwner && (
            <IconButton name="delete-forever" onPress={onDeleteLeague} />
          )}
        </View>
      ),
    });
  }, [context, leagueContext]);

  const showUserTypeSelection = () => {
    const options = [i18n._(t`Manager`), i18n._(t`Player`), i18n._(t`Cancel`)];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            if (user.uid) {
              navigation.navigate('Create Club', {
                isAdmin: false,
                newLeague: false,
                scheduled: scheduled,
                acceptClub: false,
              });
              crashlytics().log('Create Club');
            } else {
              navigation.navigate('Sign Up', {
                redirectFrom: 'leaguePreview',
              });
            }

            break;
          case 1:
            if (user.uid) {
              navigation.navigate('Join Club');
              crashlytics().log('Join Club');
            } else {
              navigation.navigate('Sign Up', {
                redirectFrom: 'leaguePreview',
              });
            }
            break;
        }
      },
    );
  };

  // const userInLeague = () => {
  //   Alert.alert(
  //     'Join League',
  //     accepted ? 'League not started' : 'Request already sent',
  //     [
  //       {
  //         text: 'Cancel',
  //         onPress: () => console.log('Cancel Pressed'),
  //         style: 'cancel',
  //       },
  //     ],
  //     {cancelable: false},
  //   );
  // };

  if (loading) {
    return (
      <FullScreenLoading visible={true} label={i18n._(t`Removing League...`)} />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
      }}>
      <ScrollView
        contentContainerStyle={{
          padding: verticalScale(16),
        }}>
        <View
          style={{
            paddingBottom: verticalScale(24),
          }}>
          <Text
            style={[
              TEXT_STYLES.body,
              {
                color: APP_COLORS.Gray,
                paddingBottom: verticalScale(4),
              },
            ]}>
            Name
          </Text>
          <Text style={TEXT_STYLES.display3}>{league.name}</Text>
        </View>
        <InfoItem
          icon={
            league.platform === 'xb' ? 'microsoft-xbox' : 'sony-playstation'
          }
          value={league.platform === 'xb' ? 'Xbox' : 'Playstation'}
          label="Platform"
        />
        <InfoItem
          icon="flag"
          value={i18n._(
            t`${league.teamNum} clubs / ${league.matchNum} matches`,
          )}
          label="Rules"
        />
        <InfoItem
          icon="account"
          value={
            Object.values(league.admins).filter(
              (admin) => admin.owner === true,
            )[0].username
          }
          label={i18n._(t`Admin`)}
        />
        {!!league.discord && (
          <InfoItem
            icon="discord"
            url={league.discord}
            label={i18n._(t`Communication`)}
            value="Discord"
          />
        )}
        {!!league.twitter && (
          <InfoItem
            icon="twitter"
            url={league.twitter}
            label={i18n._(t`Social`)}
            value="Twitter"
          />
        )}
        {!!league.description && (
          <View>
            <Text
              style={[
                TEXT_STYLES.small,
                {
                  color: APP_COLORS.Gray,
                },
              ]}>
              Description
            </Text>

            <Text style={TEXT_STYLES.body}>{league.description}</Text>
          </View>
        )}
      </ScrollView>
      {!infoMode && (
        <BigButton
          title={
            joined
              ? accepted
                ? i18n._(t`League not started`)
                : i18n._(t`Request Sent`)
              : i18n._(t`Join League`)
          }
          disabled={joined}
          onPress={() => showUserTypeSelection()}
        />
      )}
    </View>
  );
}

const OpenURLButton = ({url, value}: {url: string; value: string}) => {
  const handlePress = useCallback(async () => {
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  }, [url]);

  return (
    <Text
      style={[
        TEXT_STYLES.display5,
        {
          textDecorationLine: 'underline',
          color: APP_COLORS.Accent,
        },
      ]}
      onPress={handlePress}>
      {value}
    </Text>
  );
};

const InfoItem = (props) => (
  <View
    style={{
      flexDirection: 'row',
      paddingBottom: verticalScale(24),
    }}>
    <View
      style={{
        backgroundColor: APP_COLORS.Secondary,
        borderRadius: 4,
        marginRight: verticalScale(12),
      }}>
      <Icon
        name={props.icon}
        size={verticalScale(32)}
        style={{padding: verticalScale(8)}}
        color={APP_COLORS.Accent}
      />
    </View>
    <View
      style={{
        paddingVertical: verticalScale(4),
      }}>
      <Text
        style={[
          TEXT_STYLES.small,
          {
            color: APP_COLORS.Gray,
          },
        ]}>
        {props.label}
      </Text>
      {props.url ? (
        <OpenURLButton url={props.url} value={props.value} />
      ) : (
        <Text style={TEXT_STYLES.display5}>{props.value}</Text>
      )}
    </View>
  </View>
);
