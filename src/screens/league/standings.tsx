import React, {useContext, useEffect, useState} from 'react';
import firestore from '@react-native-firebase/firestore';
import {FlatList} from 'react-native';
import {IClubStanding} from '../../utils/interface';
// import {RouteProp} from '@react-navigation/native';
// import {LeagueStackType} from './league';
import {LeagueContext} from '../../context/leagueContext';
import {TableHeader, TableRow} from '../../components/standingItems';
import {ListSeparator} from '../../components/listItems';
import {verticalScale} from 'react-native-size-matters';

// import {StackNavigationProp} from '@react-navigation/stack';

// type ScreenRouteProp = RouteProp<LeagueStackType, 'Standings'>;

const db = firestore();

type StandingsList = {
  key: string;
  data: IClubStanding;
};

// type Props = {
//   // navigation: ScreenNavigationProp;
//   route: ScreenRouteProp;
// };

export default function LeagueStandings(/* {route}: Props */) {
  const [data, setData] = useState<{[id: string]: IClubStanding}>({});
  const [standings, setStandings] = useState<StandingsList[]>([]);

  const leagueContext = useContext(LeagueContext);
  const leagueId = leagueContext.leagueId;

  useEffect(() => {
    const standingsRef = db
      .collection('leagues')
      .doc(leagueId)
      .collection('stats')
      .doc('standings');

    standingsRef.get().then((doc) => {
      const standingsData = doc.data() as {[id: string]: IClubStanding};
      setData(standingsData);
    });
  }, [leagueId]);

  useEffect(() => {
    let leagueStandings: StandingsList[] = [];
    console.log(data, 'standings data');
    for (let [clubId, clubData] of Object.entries(data)) {
      let clubStanding: StandingsList = {
        key: clubId,
        data: clubData,
      };
      leagueStandings.push(clubStanding);
    }
    leagueStandings.sort((a, b) => {
      return b.data.points - a.data.points;
    });
    setStandings(leagueStandings);
  }, [data]);

  return (
    <FlatList
      data={standings}
      renderItem={({item, index}) => (
        <TableRow
          team={item.data.name}
          p={item.data.points}
          w={item.data.won}
          d={item.data.draw}
          l={item.data.lost}
          dif={item.data.scored - item.data.conceded}
          pts={item.data.points}
          position={index + 1}
        />
      )}
      keyExtractor={(item) => item.key}
      ItemSeparatorComponent={() => <ListSeparator />}
      ListHeaderComponent={() => <TableHeader />}
      stickyHeaderIndices={[0]}
      bounces={false}
      getItemLayout={(item, index) => ({
        length: verticalScale(48),
        offset: verticalScale(49) * index,
        index,
      })}
    />
  );
}
