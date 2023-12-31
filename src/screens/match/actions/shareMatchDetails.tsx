import {IMatchNavData} from '../../../utils/interface';
import {Share} from 'react-native';
import i18n from '../../../utils/i18n';
import {t} from '@lingui/macro';

const shareMatchDetails = async (matchData: IMatchNavData) => {
  const content = `--- PRZ MATCH REPORT ---\nLeague Name: ${
    matchData.leagueName
  },\nLeague ID: ${matchData.leagueId.slice(0, 5)},\nMatch ID: ${
    matchData.id
  },\nHome Team: ${matchData.homeTeamName},\nAway Team: ${
    matchData.awayTeamName
  }\n--- --- ---`;
  await Share.share(
    {
      message: content,
      title: i18n._(t`Share report with admin`),
    },
    {
      dialogTitle: i18n._(t`Report Match`),
    },
  );
};

export default shareMatchDetails;
