import React, {useContext, useEffect, useLayoutEffect, useState} from 'react';
import {ScrollView} from 'react-native';
import {HeaderBackButton, StackNavigationProp} from '@react-navigation/stack';
import functions from '@react-native-firebase/functions';
import {AppContext} from '../../context/appContext';
import {LeagueContext} from '../../context/leagueContext';
import {LeagueStackType} from '../league/league';
import {
  CardMedium,
  CardSmall,
  CardSmallContainer,
} from '../../components/cards';
import {verticalScale} from 'react-native-size-matters';
import FullScreenLoading from '../../components/loading';
import {RouteProp} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';

type ScreenNavigationProp = StackNavigationProp<
  LeagueStackType,
  'League Pre-Season'
>;
type ScreenRouteProp = RouteProp<LeagueStackType, 'League Pre-Season'>;

type Props = {
  navigation: ScreenNavigationProp;
  route: ScreenRouteProp;
};
const firFunc = functions();

export default function LeaguePreSeason({navigation, route}: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [clubRosterLength, setClubRosterLength] = useState(1);

  const context = useContext(AppContext);
  const leagueContext = useContext(LeagueContext);

  const leagueId = leagueContext.leagueId;
  const scheduled = leagueContext.league.scheduled;
  const userClub = context.userData.leagues[leagueId];
  const newLeague = route.params.newLeague;

  useLayoutEffect(() => {
    if (newLeague) {
      const popAction = StackActions.pop(2);

      navigation.setOptions({
        headerLeft: () => (
          <HeaderBackButton
            onPress={() => navigation.dispatch(popAction)}
            labelVisible={false}
          />
        ),
      });
    }
  }, [navigation, newLeague]);

  //FIXME:
  // useEffect(() => {
  //   if (userClub.clubId && context.userLeagues[leagueId].clubs) {
  //     const clubRoster =
  //       context.userLeagues[leagueId].clubs[userClub.clubId].roster;
  //     setClubRosterLength(Object.values(clubRoster).length);
  //   }
  // }, [context]);

  const scheduleMatches = async () => {
    setLoading(true);
    const functionRef = firFunc.httpsCallable('scheduleMatches');
    functionRef({leagueId: leagueId})
      .then((response) => {
        console.log('message from cloud', response);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: verticalScale(16),
      }}
      showsVerticalScrollIndicator={false}>
      <FullScreenLoading visible={loading} />
      {userClub.manager ? (
        <CardMedium
          onPress={() =>
            navigation.navigate('My Club', {
              clubId: userClub.clubId,
              manager: userClub.manager,
            })
          }
          title={userClub.clubName}
          subTitle={
            clubRosterLength > 1
              ? clubRosterLength + ' Players'
              : 'No members except you'
          }
        />
      ) : (
        <CardMedium
          onPress={() =>
            navigation.navigate('Create Club', {
              isAdmin: true,
            })
          }
          title="Create My Club"
          subTitle="fdf"
        />
      )}
      <CardSmallContainer>
        <CardSmall
          title={'League\nClubs'}
          onPress={() => navigation.navigate('Clubs')}
        />
        <CardSmall
          title={'Invite\nClubs'}
          onPress={() => console.log('nothing yet')}
        />
      </CardSmallContainer>
      {scheduled && (
        <CardMedium onPress={scheduleMatches} title="Schedule Matches" />
      )}
    </ScrollView>
  );
}
