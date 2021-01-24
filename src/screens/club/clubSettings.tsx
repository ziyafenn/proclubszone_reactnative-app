import React, {useContext} from 'react';
import {View, Alert} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {AppContext} from '../../context/appContext';
import {LeagueStackType} from '../league/league';
import {LeagueContext} from '../../context/leagueContext';
import removeClub from './actions/removeClub';
import removePlayer from './actions/removePlayer';
import {AuthContext} from '../../context/authContext';
import RNRestart from 'react-native-restart';
import {CardMedium} from '../../components/cards';
import {t} from '@lingui/macro';
import i18n from '../../utils/i18n';

type ScreenRouteProp = RouteProp<LeagueStackType, 'Club Settings'>;

type Props = {
  route: ScreenRouteProp;
};

export default function ClubSettings({route}: Props) {
  const user = useContext(AuthContext);
  const context = useContext(AppContext);
  const leagueContext = useContext(LeagueContext);

  const playerId = user.uid;
  const leagueId = leagueContext.leagueId;
  const clubId = route.params.clubId;
  const clubRoster = context.userLeagues[leagueId].clubs[clubId].roster;
  const isManager = context.userData.leagues[leagueId].manager;
  const adminId = leagueContext.league.adminId;
  const leagueScheduled = leagueContext.league.scheduled;

  //TODO: if admin, do not restart.

  const onRemoveClub = async () => {
    if (leagueScheduled) {
      Alert.alert(
        i18n._(t`Remove Club`),
        i18n._(t`You cannot remove club when league is scheduled`),
        [
          {
            text: i18n._(t`Close`),
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
    } else {
      Alert.alert(
        i18n._(t`Remove Club`),
        i18n._(
          t`Are you sure you want to remove your club? This action can't be undone`,
        ),
        [
          {
            text: i18n._(t`Remove`),
            onPress: () => {
              removeClub(leagueId, clubId, adminId, clubRoster).then(() => {
                RNRestart.Restart();
              });
            },
          },
          {
            text: i18n._(t`Cancel`),
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
    }
  };

  const onRemovePlayer = async () => {
    Alert.alert(
      'Leave Club',
      i18n._(
        t`Are you sure you want to leave this club? This action can't be undone`,
      ),
      [
        {
          text: i18n._(t`Leave`),
          onPress: () => {
            removePlayer({leagueId, playerId, clubId}).then(() => {
              RNRestart.Restart();
            });
          },
        },
        {
          text: i18n._(t`Cancel`),
          style: 'cancel',
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <View>
      {isManager ? (
        <CardMedium title={i18n._(t`Remove Club`)} onPress={onRemoveClub} />
      ) : (
        <CardMedium title={i18n._(t`Leave Club`)} onPress={onRemovePlayer} />
      )}
    </View>
  );
}
