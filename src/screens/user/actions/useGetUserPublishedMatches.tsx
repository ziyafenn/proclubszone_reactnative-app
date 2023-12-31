import {useContext, useEffect, useState} from 'react';
import {IMatchNavData, IMatch, FixtureList} from '../../../utils/interface';
import {AppContext} from '../../../context/appContext';
import firestore from '@react-native-firebase/firestore';

const useGetUserPublishedMatches = (uid: string) => {
  const [data, setData] = useState<FixtureList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const context = useContext(AppContext);

  const db = firestore();

  useEffect(() => {
    try {
      const publishedMatchesForPlayer = db
        .collectionGroup('matches')
        .where('published', '==', true)
        .where('notSubmittedPlayers', 'array-contains', uid)
        .orderBy('id', 'asc')
        .limit(4);

      if (context.userData && context.userLeagues) {
        setLoading(true);
        const subscriber = publishedMatchesForPlayer.onSnapshot((snapshot) => {
          let matches: FixtureList[] = [];
          if (snapshot.empty) {
            setLoading(false);
            setData([]);
            return {data, loading};
          }
          snapshot.forEach((doc) => {
            const matchData = doc.data() as IMatch;
            const matchId = doc.id;
            const leagueId = doc.ref.parent.parent.id;

            const league = context.userLeagues[leagueId];
            const userLeague = context.userData.leagues[leagueId];
            const clubId = userLeague.clubId;
            const manager = userLeague.manager;
            const leagueName = context.userLeagues[leagueId].name;
            const admin = userLeague.admin;
            const awayTeamName = league.clubIndex[matchData.awayTeamId];
            const homeTeamName = league.clubIndex[matchData.homeTeamId];

            const match: IMatchNavData = {
              ...matchData,
              homeTeamName: homeTeamName,
              awayTeamName: awayTeamName,
              clubId: clubId,
              manager: manager,
              matchId: matchId,
              leagueId: leagueId,
              leagueName: leagueName,
              admin: admin,
            };

            const fixture: FixtureList = {
              id: matchId,
              data: match,
            };
            matches.push(fixture);
          });
          setData(matches);
          setLoading(false);
        });
        return subscriber;
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      throw new Error(err);
    }
  }, [context.userLeagues]);

  return {data, loading};
};

export default useGetUserPublishedMatches;
