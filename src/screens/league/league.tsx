import React, {useState, useContext, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {AppContext} from '../../context/appContext';
import {AuthContext} from '../../context/authContext';
import {ILeague, ILeagueProps, IMatchNavData} from '../../utils/interface';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {RouteProp, StackActions} from '@react-navigation/native';
import {AppNavStack} from '../index';
import {LeagueContext} from '../../context/leagueContext';
import {NonModalLoading} from '../../components/loading';
import {Alert} from 'react-native';
import {IconButton} from '../../components/buttons';
import crashlytics from '@react-native-firebase/crashlytics';
import i18n from '../../utils/i18n';
import {t} from '@lingui/macro';
// Screens
import LeaguePreview from './leaguePreview';
import LeaguePreSeason from './leaguePreSeason';
import LeagueScheduled from './leagueScheduled';
import AdminCenter from './adminCenter';
import Match from '../match/match';
import LeagueStandings from './standings';
import Fixtures from './fixtures';
import JoinClub from '../club/joinClub';
import Clubs from './clubs';
import CreateClub from '../club/createClub';
import Club from '../club/club';
import ClubSettings from '../club/clubSettings';
import SignIn from '../auth/signIn';
import Stats from './stats';
import SignUp from '../auth/signUp';
import analytics from '@react-native-firebase/analytics';
import LeagueTeam from './leagueTeam';
import TransferHistory from './transferHistory';
import ClubProfile from '../club/clubProfile';

interface ClubProps {
  clubId: string;
  manager?: boolean;
}

type SignIn = {data?: {}; redirectedFrom?: string | null};

export type LeagueStackType = {
  'League Scheduled': ILeagueProps;
  Clubs: ILeagueProps;
  'League Preview': {
    infoMode: boolean;
  };
  'League Pre-Season': ILeagueProps;
  'Create Club': ILeagueProps;
  'Join Club': undefined;
  Standings: ILeagueProps;
  Fixtures: ILeagueProps;
  Match: {matchData: IMatchNavData; upcoming: boolean};
  'My Club': ClubProps;
  'Club Settings': ClubProps;
  'Club Profile': ClubProps;
  'Admin Center': ILeagueProps;
  'Sign In': {
    redirectFrom: string;
  };
  'Sign Up': {
    redirectFrom: string;
  };
  Stats: undefined;
  'League Team': undefined;
  'Transfer History': {
    leagueId: string;
  };
};

const Stack = createStackNavigator<LeagueStackType>();

type ScreenRouteProp = RouteProp<AppNavStack, 'League'>;
type ScreenNavigationProp = StackNavigationProp<AppNavStack, 'League'>;

type Props = {
  route: ScreenRouteProp;
  navigation: ScreenNavigationProp;
};

const db = firestore();

export default function LeagueStack({navigation, route}: Props) {
  const [league, setLeague] = useState<ILeague>();
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [leagueScheduled, setLeagueScheduled] = useState(false);
  const [inLeague, setInLeague] = useState(false);
  const user = useContext(AuthContext);
  const context = useContext(AppContext);
  const leagueContext = useContext(LeagueContext);

  const leagueId = route.params.leagueId;
  const newLeague = route.params.newLeague;

  const showNotFound = () => {
    Alert.alert(
      i18n._(t`League not found`),
      i18n._(t`League link has expired or wrong`),
      [
        {
          text: i18n._(t`Close`),
          onPress: () => navigation.dispatch(StackActions.popToTop()),

          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    const getLeagueData = async () => {
      try {
        const leagueRef = db.collection('leagues').doc(leagueId);
        let leagueInfo: ILeague;
        const leagueDoc = await leagueRef.get();

        if (!leagueDoc.exists) {
          setNotFound(true);
          showNotFound();
        } else {
          leagueInfo = leagueDoc.data() as ILeague;
          leagueContext.setLeagueId(leagueId);
          leagueContext.setLeague(leagueInfo);
          setLeague(leagueInfo);
        }
        // first part end
        const userData = context.userData;
        const uid = user.uid;

        let role: string = 'guest';

        if (user && userData) {
          const userDataLeague = userData.leagues?.[leagueId];
          role = userDataLeague?.admin
            ? 'admin'
            : userDataLeague?.manager
            ? 'manager'
            : 'player';
        }

        const log = async () => {
          await Promise.all([
            crashlytics().setAttributes({
              leagueId: leagueId,
              role: role,
              leagueName: leagueInfo.name,
              clubName: userData?.leagues?.[leagueId]?.clubName,
            }),
            analytics().logEvent('league_view', {
              leagueId: leagueId,
              role: role,
              leagueName: leagueInfo?.name,
              clubName: userData?.leagues?.[leagueId]?.clubName,
            }),
          ]).catch((logErr) => {
            throw new Error(logErr);
          });
        };

        const userInLeague =
          (userData?.leagues && userData.leagues[leagueId]?.accepted) ?? false;
        const scheduled = leagueInfo?.scheduled ?? false;
        const userAdmin =
          userData &&
          leagueInfo &&
          Object.keys(leagueInfo.admins).some((adminUid) => adminUid === uid);
        await log();
        setLeagueScheduled(scheduled);
        setIsAdmin(userAdmin);
        setInLeague(userInLeague);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        throw new Error(error);
      }
    };
    getLeagueData();
  }, [leagueId, context.userData]);

  const commonStack = (
    <>
      <Stack.Screen name="Create Club" component={CreateClub} />
      <Stack.Screen name="Clubs" component={Clubs} />
      <Stack.Screen name="My Club" component={Club} />
      <Stack.Screen name="Club Settings" component={ClubSettings} />
      <Stack.Screen name="Club Profile" component={ClubProfile} />
    </>
  );

  if (loading || notFound) {
    return <NonModalLoading visible={true} />;
  }

  if (!notFound && leagueScheduled) {
    if (inLeague || isAdmin) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerBackTitleVisible: false,
            animationEnabled: false,
          }}>
          <Stack.Screen
            name="League Scheduled"
            component={LeagueScheduled}
            options={{
              animationTypeForReplace: 'pop',
              title: league.name,
              headerRight: () => (
                <IconButton
                  name="information"
                  onPress={() => {
                    navigation.navigate('League Preview', {
                      infoMode: true,
                    });
                  }}
                />
              ),
            }}
          />
          <Stack.Screen name="Standings" component={LeagueStandings} />
          <Stack.Screen name="Stats" component={Stats} />
          <Stack.Screen
            name="Fixtures"
            component={Fixtures}
            options={{
              headerStyle: {
                elevation: 0,
              },
            }}
          />
          <Stack.Screen
            name="Match"
            component={Match}
            options={{headerShown: false}}
          />
          <Stack.Screen name="Admin Center" component={AdminCenter} />
          <Stack.Screen name="League Team" component={LeagueTeam} />
          <Stack.Screen name="Transfer History" component={TransferHistory} />
          {commonStack}
        </Stack.Navigator>
      );
    } else {
      return (
        <Stack.Navigator
          screenOptions={{
            headerBackTitleVisible: false,
            animationEnabled: false,
          }}>
          <Stack.Screen name="League Preview" component={LeaguePreview} />
          <Stack.Screen name="Sign In" component={SignIn} />
          <Stack.Screen name="Sign Up" component={SignUp} />
          <Stack.Screen name="Join Club" component={JoinClub} />
          {commonStack}
        </Stack.Navigator>
      );
    }
  }

  if (isAdmin) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerBackTitleVisible: false,
          animationEnabled: false,
        }}>
        <Stack.Screen
          name="League Pre-Season"
          component={LeaguePreSeason}
          initialParams={{newLeague: newLeague}}
          options={{
            title: league!.name,
            headerRight: () => (
              <IconButton
                name="information"
                onPress={() => {
                  navigation.navigate('League Preview', {
                    infoMode: true,
                  });
                }}
              />
            ),
          }}
        />
        <Stack.Screen name="Transfer History" component={TransferHistory} />
        {commonStack}
      </Stack.Navigator>
    );
  } else {
    return (
      <Stack.Navigator
        screenOptions={{
          headerBackTitleVisible: false,
          animationEnabled: false,
        }}>
        <Stack.Screen name="League Preview" component={LeaguePreview} />
        <Stack.Screen name="Join Club" component={JoinClub} />
        <Stack.Screen name="Sign In" component={SignIn} />
        <Stack.Screen name="Sign Up" component={SignUp} />
        {commonStack}
      </Stack.Navigator>
    );
  }
}
