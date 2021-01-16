import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../../context/authContext';
// import firestore from '@react-native-firebase/firestore';
import {ILeague} from '../../utils/interface';
import {AppNavStack} from '../index';
import {StackNavigationProp} from '@react-navigation/stack';
import TextField from '../../components/textField';
import {BigButton} from '../../components/buttons';
import {FormView, FormContent} from '../../components/templates';
import {AppContext} from '../../context/appContext';
import FullScreenLoading from '../../components/loading';
import {Alert, Platform, View} from 'react-native';
import Picker from '../../components/picker';
import {APP_COLORS} from '../../utils/designSystem';
import createLeague from '../../actions/createLeague';

type ScreenNavigationProp = StackNavigationProp<AppNavStack, 'Create League'>;

type Props = {
  navigation: ScreenNavigationProp;
};

export default function CreateLeague({navigation}: Props) {
  const user = useContext(AuthContext);
  const context = useContext(AppContext);

  const uid = user.uid;

  //const userLeagues = context.userData.leagues;

  const leagueInfoDefault: ILeague = {
    adminUsername: '',
    name: '',
    description: '',
    discord: '',
    twitter: '',
    platform: 'ps',
    teamNum: 8,
    acceptedClubs: 0,
    matchNum: 2,
    adminId: null,
    private: false,
    scheduled: false,
    created: null,
    conflictMatchesCount: 0,
  };

  type PickerProps = {
    platform: boolean;
    teamNum: boolean;
    matchNum: boolean;
  };

  const [data, setData] = useState(leagueInfoDefault);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLeague, setHasLeague] = useState<boolean>(false);
  const [tempData, setTempData] = useState<Partial<ILeague>>({
    platform: data.platform,
    teamNum: data.teamNum,
    matchNum: data.matchNum,
  });
  const [error, setError] = useState({
    name: null,
  });

  // useEffect(() => {
  //   if (userLeagues) {
  //     for (const league of Object.values(userLeagues)) {
  //       if (league.admin) {
  //         return setHasLeague(true);
  //       }
  //     }
  //   }
  // }, [userLeagues]);

  useEffect(() => {
    if (error.name && data.name !== '') {
      setError({...error, name: null});
    }
  }, [data.name]);

  const fieldValidation = async () => {
    if (data.name === '') {
      setError({...error, name: "Field can't be empty"});
      return false;
    }
    if (data.name.length < 4 && data.name !== '') {
      setError({...error, name: 'At least 4 letters'});
      return false;
    }
    return true;
  };

  const showLimitAlert = () => {
    Alert.alert(
      'League Limit Reached',
      'You cannot create more than one league',
      [
        {
          text: 'Close',
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  const onCreateLeague = () => {
    fieldValidation().then(async (noErrors) => {
      if (noErrors) {
        if (uid) {
          setLoading(true);
          const username = context.userData.username;
          await createLeague(data, uid, username).then((leagueId) => {
            context.setUserData({
              leagues: {
                [leagueId]: {
                  admin: true,
                  manager: false,
                },
              },
            });
            context.setUserLeagues({
              [leagueId]: data,
            });
            setLoading(false);
            navigation.navigate('League', {
              leagueId: leagueId,
              isAdmin: true,
              newLeague: true,
            });
          });
        } else {
          navigation.navigate('Sign Up', {
            data: data,
            redirectedFrom: 'createLeague',
          });
        }
      }
    });
  };

  const pickerItemColor =
    Platform.OS === 'ios' ? APP_COLORS.Light : APP_COLORS.Dark;

  return (
    <FormView>
      <FullScreenLoading visible={loading} />
      <FormContent>
        <TextField
          onChangeText={(text) => setData({...data, name: text})}
          value={data.name}
          placeholder="i.e. La Liga"
          label="League Name"
          error={error.name}
          helper="Minimum 4 letters, no profanity"
        />
        <Picker
          onValueChange={(itemValue) =>
            Platform.OS === 'ios'
              ? setTempData({...tempData, platform: itemValue})
              : setData({...data, platform: itemValue})
          }
          onDonePress={() => {
            setData({...data, platform: tempData.platform});
          }}
          items={[
            {label: 'Playstation', value: 'ps', color: pickerItemColor},
            {label: 'Xbox', value: 'xb', color: pickerItemColor},
          ]}
          value={Platform.OS === 'ios' ? tempData.platform : data.platform}>
          <TextField
            value={data.platform === 'ps' ? 'Playstation' : 'Xbox'}
            placeholder="Select Platform"
            label="Platform"
            fieldIco="chevron-down"
            editable={false}
          />
        </Picker>
        <View
          style={{
            flexDirection: 'row',
          }}>
          <View
            style={{
              flex: 1,
              marginRight: 24,
            }}>
            <Picker
              onValueChange={(itemValue) =>
                Platform.OS === 'ios'
                  ? setTempData({...tempData, teamNum: itemValue})
                  : setData({...data, teamNum: itemValue})
              }
              onDonePress={() => {
                setData({...data, teamNum: tempData.teamNum});
              }}
              items={[
                {label: '4 Teams', value: 4, color: pickerItemColor},
                {label: '6 Teams', value: 6, color: pickerItemColor},
                {label: '8 Teams', value: 8, color: pickerItemColor},
                {label: '10 Teams', value: 10, color: pickerItemColor},
                {label: '12 Teams', value: 12, color: pickerItemColor},
                {label: '14 Teams', value: 14, color: pickerItemColor},
                {label: '16 Teams', value: 16, color: pickerItemColor},
              ]}
              value={Platform.OS === 'ios' ? tempData.teamNum : data.teamNum}>
              <TextField
                placeholder="Teams"
                label="Teams"
                value={`${data.teamNum} Teams`}
                fieldIco="chevron-down"
                editable={false}
              />
            </Picker>
          </View>
          <View
            style={{
              flex: 1,
            }}>
            <Picker
              onValueChange={(itemValue) =>
                Platform.OS === 'ios'
                  ? setTempData({...tempData, matchNum: itemValue})
                  : setData({...data, matchNum: itemValue})
              }
              onDonePress={() => {
                setData({...data, matchNum: tempData.matchNum});
              }}
              items={[
                {label: '1 Match', value: 1, color: pickerItemColor},
                {label: '2 Matches', value: 2, color: pickerItemColor},
                {label: '3 Matches', value: 3, color: pickerItemColor},
                {label: '4 Matches', value: 4, color: pickerItemColor},
              ]}
              value={Platform.OS === 'ios' ? tempData.matchNum : data.matchNum}>
              <TextField
                value={`${data.matchNum} Matches`}
                placeholder="Matches"
                label="Matches"
                fieldIco="chevron-down"
                editable={false}
              />
            </Picker>
          </View>
        </View>
        <TextField
          value={data.description}
          placeholder="Describe your league in a few sentences..."
          label="Description"
          multiline={true}
          onChangeText={(text) => setData({...data, description: text})}
          autoCapitalize="sentences"
        />
        <TextField
          value={data.discord}
          placeholder="Discord URL"
          label="Discord"
          onChangeText={(text) => setData({...data, discord: text})}
          autoCapitalize="none"
        />
        <TextField
          value={data.twitter}
          placeholder="Twitter URL"
          label="Twitter"
          onChangeText={(text) => setData({...data, twitter: text})}
          autoCapitalize="none"
        />
      </FormContent>
      <BigButton
        onPress={hasLeague ? showLimitAlert : onCreateLeague}
        title="Create League"
      />
    </FormView>
  );
}
