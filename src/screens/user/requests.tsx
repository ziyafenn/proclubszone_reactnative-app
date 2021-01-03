import React, {useContext, useState} from 'react';
import {SectionList} from 'react-native';
import {AuthContext} from '../../context/authContext';
import {RequestContext} from '../../context/requestContext';
import firestore from '@react-native-firebase/firestore';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {
  IClubRequest,
  IClubRequestData,
  ILeagueRequest,
  IMyRequests,
  IPlayerRequestData,
} from '../../utils/interface';
import {ListHeading, ListSeparator, OneLine} from '../../components/listItems';
import EmptyState from '../../components/emptyState';
import {useActionSheet} from '@expo/react-native-action-sheet';
import handleClubRequest from '../club/actions/handleClubRequest';
import {AppContext} from '../../context/appContext';
import handleLeagueRequest from '../club/actions/handleLeagueRequest';

const db = firestore();
const Tab = createMaterialTopTabNavigator();

export default function Requests() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Club" component={ClubRequests} />
      <Tab.Screen name="League" component={LeagueRequests} />
      <Tab.Screen name="Sent" component={MySentRequests} />
    </Tab.Navigator>
  );
}

function ClubRequests() {
  const requestContext = useContext(RequestContext);
  const {showActionSheetWithOptions} = useActionSheet();
  const requests: IClubRequest[] = requestContext.clubs;
  const context = useContext(AppContext);

  const [data, setData] = useState<IClubRequest[]>(() => requests);
  const [loading, setLoading] = useState(true);

  const onHandlePlayerRequest = async (
    selectedPlayer: IPlayerRequestData,
    sectionTitle: string,
    acceptRequest: boolean,
  ) => {
    setLoading(true);

    await handleClubRequest(data, selectedPlayer, sectionTitle, acceptRequest)
      .then((newData) => {
        setData(newData);
        requestContext.setClubs(newData);
        const currentCount = requestContext.requestCount;
        requestContext.setClubCount(currentCount === 1 ? 0 : currentCount - 1);
      })
      .then(() => {
        const currentLeagueData = {...context.userLeagues};
        currentLeagueData[selectedPlayer.leagueId].clubs[
          selectedPlayer.clubId
        ].roster[selectedPlayer.playerId].accepted = true;
        context.setUserLeagues(currentLeagueData);
        setLoading(false);
      });
  };

  const onOpenActionSheet = (item: IPlayerRequestData, title: string) => {
    const options = ['Accept', 'Decline', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            onHandlePlayerRequest(item, title, true);
            break;
          case 1:
            onHandlePlayerRequest(item, title, false);
            break;
        }
      },
    );
  };

  return (
    <SectionList
      sections={data}
      stickySectionHeadersEnabled={true}
      keyExtractor={(item) => item.playerId}
      renderItem={({item, section}) => (
        <OneLine
          title={item.username}
          onPress={() => onOpenActionSheet(item, section.title)}
        />
      )}
      ItemSeparatorComponent={() => <ListSeparator />}
      renderSectionHeader={({section: {title}}) => <ListHeading col1={title} />}
      ListEmptyComponent={() => (
        <EmptyState title="No Public Leagues" body="Check out later" />
      )}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: data.length === 0 ? 'center' : null,
      }}
    />
  );
}

function LeagueRequests() {
  const requestContext = useContext(RequestContext);
  const {showActionSheetWithOptions} = useActionSheet();
  const requests: ILeagueRequest[] = requestContext.leagues;

  const [data, setData] = useState<ILeagueRequest[]>(requests);
  const [loading, setLoading] = useState(true);

  const onHandleLeagueRequest = async (
    selectedClub: IClubRequestData,
    sectionTitle: string,
    acceptRequest: boolean,
  ) => {
    setLoading(true);

    await handleLeagueRequest(
      data,
      selectedClub,
      sectionTitle,
      acceptRequest,
    ).then((newData) => {
      setData(newData);
      requestContext.setLeagues(newData);
      const currentCount = requestContext.requestCount;
      requestContext.setLeagueCount(currentCount === 1 ? 0 : currentCount - 1);
      setLoading(false);
    });
  };

  const onOpenActionSheet = (item: IClubRequestData, title: string) => {
    const options = ['Accept', 'Decline', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            onHandleLeagueRequest(item, title, true);
            break;
          case 1:
            onHandleLeagueRequest(item, title, false);
            break;
        }
      },
    );
  };

  return (
    <SectionList
      sections={data}
      stickySectionHeadersEnabled={true}
      keyExtractor={(item) => item.clubId}
      renderItem={({item, section}) => (
        <OneLine
          title={item.name}
          onPress={() => onOpenActionSheet(item, section.title)}
        />
      )}
      ItemSeparatorComponent={() => <ListSeparator />}
      renderSectionHeader={({section: {title}}) => <ListHeading col1={title} />}
      ListEmptyComponent={() => (
        <EmptyState title="No Public Leagues" body="Check out later" />
      )}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: data.length === 0 ? 'center' : null,
      }}
    />
  );
}

function MySentRequests() {
  const requestContext = useContext(RequestContext);
  const user = useContext(AuthContext);
  const {showActionSheetWithOptions} = useActionSheet();

  const clubRequests: IMyRequests = requestContext.myClubRequests;
  const leagueRequests: IMyRequests = requestContext.myLeagueRequests;

  let requests: IMyRequests[] = [];

  clubRequests && requests.push(clubRequests);
  leagueRequests && requests.push(leagueRequests);

  const [data, setData] = useState<IMyRequests[] | undefined>(requests);

  const uid = user?.uid;

  type Props = {
    clubId: string;
    leagueId: string;
  };

  const onCancelRequest = async (
    {clubId, leagueId}: Props,
    sectionTitle: string,
  ) => {
    const clubRef = db
      .collection('leagues')
      .doc(leagueId)
      .collection('clubs')
      .doc(clubId);

    const userRef = db.collection('users').doc(uid);
    const batch = db.batch();

    const sectionIndex = data.findIndex(
      (section) => section.title === sectionTitle,
    );

    const newData = [...data];

    if (sectionTitle === 'Club Requests') {
      const openClubRequests = data[sectionIndex].data.filter((club) => {
        return club.clubId !== clubId;
      });

      newData[sectionIndex].data = openClubRequests;

      if (openClubRequests.length === 0) {
        newData.splice(sectionIndex, 1);
      }

      setData(newData);

      requestContext?.setMyClubRequests(newData[sectionIndex]);

      batch.update(clubRef, {
        ['roster.' + uid]: firestore.FieldValue.delete(),
      });
      batch.update(userRef, {
        ['leagues.' + leagueId]: firestore.FieldValue.delete(),
      });
    } else {
      const openLeagueRequests = data[sectionIndex].data.filter((league) => {
        return league.leagueId !== leagueId;
      });

      newData[sectionIndex].data = openLeagueRequests;

      if (openLeagueRequests.length === 0) {
        newData.splice(sectionIndex, 1);
      }

      setData(newData);
      requestContext?.setMyLeagueRequests(newData[sectionIndex]);

      batch.delete(clubRef);
      batch.update(userRef, {
        ['leagues.' + leagueId]: firestore.FieldValue.delete(),
      });
    }
    await batch.commit();
  };

  const onOpenActionSheet = (item: Props, title: string) => {
    const options = ['Accept', 'Decline', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            onCancelRequest(item, title);
            break;
          case 1:
            console.log('decline club');
            break;
        }
      },
    );
  };

  return (
    <SectionList
      sections={data}
      stickySectionHeadersEnabled={true}
      keyExtractor={(item) => item.clubId}
      renderItem={({item, section}) => (
        <OneLine
          title={item.clubName}
          onPress={() => onOpenActionSheet(item, section.title)}
        />
      )}
      ItemSeparatorComponent={() => <ListSeparator />}
      renderSectionHeader={({section: {title, key}}) => (
        <ListHeading key={key} col1={title} />
      )}
      ListEmptyComponent={() => (
        <EmptyState title="No Public Leagues" body="Check out later" />
      )}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: data.length === 0 ? 'center' : null,
      }}
    />
  );
}
