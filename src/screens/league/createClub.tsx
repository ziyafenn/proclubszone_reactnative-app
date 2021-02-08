import React, {useContext, useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {AppContext} from '../../context/appContext';
import {AuthContext} from '../../context/authContext';
import {IClub, IUserLeague} from '../../utils/interface';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {LeagueStackType} from './league';
import {FormView, FormContent} from '../../components/templates';
import {BigButton} from '../../components/buttons';
import TextField from '../../components/textField';
import FullScreenLoading from '../../components/loading';
import {LeagueContext} from '../../context/leagueContext';
import analytics from '@react-native-firebase/analytics';
import {t} from '@lingui/macro';
import i18n from '../../utils/i18n';

type ScreenNavigationProp = StackNavigationProp<LeagueStackType, 'Create Club'>;

type ScreenRouteProp = RouteProp<LeagueStackType, 'Create Club'>;

type Props = {
  navigation: ScreenNavigationProp;
  route: ScreenRouteProp;
};

const db = firestore();

export default function CreateClub({route, navigation}: Props) {
  const [clubName, setClubName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState({
    clubName: '',
  });

  const user = useContext(AuthContext);
  const context = useContext(AppContext);
  const leagueContext = useContext(LeagueContext);

  const leagueId = leagueContext.leagueId;
  const uid = user.uid!;
  const isAdmin = route?.params?.isAdmin;
  const username = context.userData!.username;

  useEffect(() => {
    if (error.clubName && clubName !== '') {
      setError({...error, clubName: ''});
    }
  }, [clubName]);

  const fieldValidation = async () => {
    if (clubName === '') {
      setError({...error, clubName: i18n._(t`Field can't be empty`)});
      return false;
    }
    if (clubName.length < 4 && clubName !== '') {
      setError({...error, clubName: i18n._(t`At least ${4} letters`)});
      return false;
    }
    return true;
  };

  const onCreateClub = () => {
    fieldValidation().then(async (noErrors) => {
      if (noErrors) {
        setLoading(true);
        const batch = db.batch();
        const leagueRef = db.collection('leagues').doc(leagueId);
        const userRef = db.collection('users').doc(uid);
        const clubRef = leagueRef.collection('clubs').doc();

        const clubInfo: IClub = {
          name: clubName.trim(),
          managerId: uid,
          managerUsername: username,
          accepted: isAdmin ? true : false,
          roster: {
            [uid]: {
              accepted: true,
              username: username,
            },
          },
          created: firestore.Timestamp.now(),
        };
        const userInfo: IUserLeague = {
          clubId: clubRef.id,
          manager: true,
          clubName: clubName.trim(),
          accepted: isAdmin ? true : false,
        };

        if (isAdmin) {
          batch.update(leagueRef, {
            acceptedClubs: firestore.FieldValue.increment(1),
          });
        }
        batch.set(clubRef, clubInfo);
        batch.set(
          userRef,
          {
            leagues: {
              [leagueId]: userInfo,
            },
          },
          {merge: true},
        );
        await batch.commit().then(async () => {
          await analytics().logJoinGroup({
            group_id: leagueContext.leagueId,
          });
          let updateLeagueInfo = {...leagueContext.league};
          updateLeagueInfo.acceptedClubs += 1;
          leagueContext.setLeague(updateLeagueInfo);

          let userData = {...context.userData!};
          userData.leagues = {
            ...userData.leagues,
            [leagueId]: userInfo,
          };

          let userLeagues = {...context.userLeagues};

          userLeagues[leagueId] = {
            ...userLeagues[leagueId],
            clubs: {
              [clubRef.id]: clubInfo,
            },
          };

          context.setUserData(userData);
          context.setUserLeagues(userLeagues);
          setLoading(false);
          navigation.goBack();
        });
      }
    });
  };

  if (loading) {
    return <FullScreenLoading visible={loading} />;
  }

  return (
    <FormView>
      <FormContent>
        <TextField
          onChangeText={(text) => setClubName(text)}
          value={clubName}
          placeholder={i18n._(t`Club Name`)}
          autoCorrect={false}
          label={i18n._(t`Club Name`)}
          error={error.clubName}
          helper={i18n._(t`Minimum ${4} letters, no profanity`)}
          maxLength={15}
        />
      </FormContent>
      <BigButton onPress={onCreateClub} title={i18n._(t`Create Club`)} />
    </FormView>
  );
}
