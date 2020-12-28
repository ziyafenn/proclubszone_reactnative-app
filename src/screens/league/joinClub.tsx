import React, {useContext, useEffect, useState} from 'react';
import {Text, View, Button, Alert, FlatList} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {AppContext} from '../../context/appContext';
import {AuthContext} from '../../context/authContext';
import {IClub, IClubRosterMember, IUserLeague} from '../../utils/interface';
import {RouteProp} from '@react-navigation/native';
import {LeagueStackType} from './league';
import FullScreenLoading from '../../components/loading';

type ScreenRouteProp = RouteProp<LeagueStackType, 'Join Club'>;

type Props = {
  //  navigation: ScreenNavigationProp;
  route: ScreenRouteProp;
};

const db = firestore();
type ClubData = IClub & {key: string};

export default function JoinClub({route}: Props) {
  const [data, setData] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);

  const context = useContext(AppContext);
  const user = useContext(AuthContext);
  const uid = user?.uid;
  const userRef = db.collection('users').doc(uid);
  const leagueId = route.params.leagueId;
  const leagueRef = db.collection('leagues').doc(leagueId);
  const leagueClubs = leagueRef.collection('clubs');

  useEffect(() => {
    let retrievedClubs: ClubData[] = [];
    leagueClubs
      .where('accepted', '==', true)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          retrievedClubs.push({...(doc.data() as IClub), key: doc.id});
        });
        setData(retrievedClubs);
        setLoading(false);
      });
  }, []);

  const onSendRequestConfirm = async (clubId: string) => {
    const clubRef = leagueClubs.doc(clubId);
    const userInfo: {[leagueId: string]: IUserLeague} = {
      [leagueId]: {
        clubId: clubId,
        accepted: false,
        manager: false,
      },
    };
    const rosterMember: {[uid: string]: IClubRosterMember} = {
      [uid]: {
        accepted: false,
        username: context?.userData?.username,
      },
    };
    const batch = db.batch();

    batch.set(
      clubRef,
      {
        roster: rosterMember,
      },
      {merge: true},
    );
    batch.set(
      userRef,
      {
        leagues: userInfo,
      },
      {merge: true},
    );
    return batch.commit();
  };

  const onSendRequest = (clubId: string) => {
    console.log('onsendrequest');
    Alert.alert(
      'Join Club',
      'Send request to "club name" to join?',
      [
        {
          text: 'Send Request',
          onPress: () => {
            setLoading(true);
            onSendRequestConfirm(clubId).then(() => setLoading(false));
          },
        },
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <>
      <FullScreenLoading visible={loading} />
      <FlatList
        data={data}
        renderItem={({item}: any) => (
          <Club name={item.name} onPress={() => onSendRequest(item.key)} />
        )}
      />
    </>
  );
}

const Club = (props) => {
  return (
    <View>
      <Text>{props.name}</Text>
      <Button title="Send Request" onPress={props.onPress} />
    </View>
  );
};
