import firestore from '@react-native-firebase/firestore';
import {
  IClub,
  IClubRequestData,
  ILeagueAdmin,
  IUserLeague,
} from '../../../utils/interface';
import analytics from '@react-native-firebase/analytics';

type Props = {
  oldClub: IClubRequestData;
  newClub: IClubRequestData;
  leagueAdmins: ILeagueAdmin;
};

const swapClubs = async ({oldClub, newClub, leagueAdmins}: Props) => {
  const db = firestore();
  const batch = db.batch();
  const leagueId = oldClub.leagueId;
  const leagueRef = db.collection('leagues').doc(leagueId);
  const clubRef = leagueRef.collection('clubs');
  const standingsRef = leagueRef.collection('stats').doc('standings');

  const usersRef = db.collection('users');

  const newClubData: IClub = {
    accepted: true,
    created: newClub.created,
    managerId: newClub.managerId,
    managerUsername: newClub.managerUsername,
    name: newClub.name,
    roster: {...newClub.roster},
    leagueId: newClub.leagueId,
  };

  batch.set(
    standingsRef,
    {[oldClub.clubId]: {name: newClub.name}},
    {merge: true},
  );
  batch.set(clubRef.doc(oldClub.clubId), newClubData);
  batch.delete(clubRef.doc(newClub.clubId));

  for (const playerId of Object.keys(oldClub.roster)) {
    const isAdmin = Object.keys(leagueAdmins).some(
      (adminUid) => adminUid === playerId,
    );

    if (isAdmin) {
      batch.update(usersRef.doc(playerId), {
        ['leagues.' + leagueId + '.accepted']: firestore.FieldValue.delete(),
        ['leagues.' + leagueId + '.clubId']: firestore.FieldValue.delete(),
        ['leagues.' + leagueId + '.clubName']: firestore.FieldValue.delete(),
        ['leagues.' + leagueId + '.manager']: firestore.FieldValue.delete(),
      });
    } else {
      batch.update(usersRef.doc(playerId), {
        ['leagues.' + leagueId]: firestore.FieldValue.delete(),
      });
    }
  }

  for (const playerId of Object.keys(newClub.roster)) {
    batch.set(
      usersRef.doc(playerId),
      {
        leagues: {
          [leagueId]: {
            clubId: oldClub.clubId,
            accepted: true,
          },
        },
      },
      {merge: true},
    );

    batch.set(
      leagueRef,
      {
        clubIndex: {
          [oldClub.clubId]: newClub.name,
        },
      },
      {merge: true},
    );
  }

  await Promise.all([
    batch.commit(),
    analytics().logEvent('swap_clubs', {
      leagueId: leagueId,
    }),
  ]);
};

export default swapClubs;
