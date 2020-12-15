import React, {useContext} from 'react';
import {Text, View, Button} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {AppContext} from '../../utils/context';
import CreateLeague from '../league/createLeague';
import LeagueExplorer from './leagueExplorer';
import LeaguePreview from '../league/leaguePreview';
import SignUp from '../auth/signUp';
import CreateClub from '../league/createClub';
import League from '../league/league';
import Clubs from '../leagueAdmin/clubs';
import JoinClub from '../league/joinClub';
import LeagueStandings from '../league/standings';
import Fixtures from '../league/fixtures';

const Stack = createStackNavigator();

function Leagues() {
  return (
    <Stack.Navigator initialRouteName="Leagues">
      <Stack.Screen name="Leagues" component={LeaguesContent} />
      <Stack.Screen name="Create league" component={CreateLeague} />
      <Stack.Screen name="League" component={League} />
      <Stack.Screen name="Clubs" component={Clubs} />
      <Stack.Screen name="League Explorer" component={LeagueExplorer} />
      <Stack.Screen name="League Preview" component={LeaguePreview} />
      <Stack.Screen name="Sign Up" component={SignUp} />
      <Stack.Screen name="Create Club" component={CreateClub} />
      <Stack.Screen name="Join Club" component={JoinClub} />
      <Stack.Screen name="Standings" component={LeagueStandings} />
      <Stack.Screen name="Fixtures" component={Fixtures} />
    </Stack.Navigator>
  );
}

function LeaguesContent({navigation}) {
  const context = useContext(AppContext);
  return (
    <View>
      <Text>Leagues Screen</Text>
      <Button
        onPress={() => navigation.navigate('Create league')}
        title="Create League"
      />
      <Button
        title="League Explorer"
        onPress={() => navigation.navigate('League Explorer')}
      />
      <Button title="Join League" />
    </View>
  );
}

export default Leagues;
