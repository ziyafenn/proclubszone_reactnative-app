import React, {
  useEffect,
  useState,
  createContext,
  Dispatch,
  SetStateAction,
} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {
  AppContextInt,
  ClubRequestInt,
  LeagueInt,
  LeagueRequestInt,
  MyRequests,
  SectionListInt,
  UserDataInt,
} from './globalTypes';

const appContextValue: AppContextInt = {
  userData: {} as UserDataInt,
  userLeagues: {},
};

const AppContext = createContext<{
  data: Partial<AppContextInt>;
  update: (newData: Partial<AppContextInt>) => void;
} | null>(null);
const AuthContext = createContext<{uid: string} | undefined>(undefined);
const RequestContext = createContext<{
  club: ClubRequestInt[];
  league: LeagueRequestInt[];
  myRequests: MyRequests[];
  updateClubs: (newData: ClubRequestInt[]) => void;
  updateLeagues: (newData: LeagueRequestInt[]) => void;
  updateMyRequests: (newData: MyRequests) => void;
  setLeagueCount: Dispatch<SetStateAction<number>>;
  setClubCount: Dispatch<SetStateAction<number>>;
  leagueCount: number;
  clubCount: number;
} | null>(null);
const db = firestore();
const firAuth = auth();
const firFunc = functions();

const RequestProvider = (props: any) => {
  const [myRequests, setMyRequests] = useState<MyRequests[]>([]);
  const [club, setClub] = useState<ClubRequestInt[]>([]);
  const [league, setLeague] = useState<LeagueRequestInt[]>([]);
  const [leagueCount, setLeagueCount] = useState<number>(0);
  const [clubCount, setClubCount] = useState<number>(0);

  const updateMyRequests = (newData: MyRequests) => {
    setMyRequests([...myRequests, newData]);
  };

  const updateClubs = (newData: ClubRequestInt[]) => {
    setClub(newData);
  };
  const updateLeagues = (newData: LeagueRequestInt[]) => {
    setLeague(newData);
  };

  return (
    <RequestContext.Provider
      value={{
        myRequests,
        club,
        league,
        updateClubs,
        updateLeagues,
        updateMyRequests,
        setLeagueCount,
        setClubCount,
        leagueCount,
        clubCount,
      }}>
      {props.children}
    </RequestContext.Provider>
  );
};

const AppProvider = (props: any) => {
  const [data, setData] = useState<Partial<AppContextInt>>(appContextValue);

  const update = (newData: Partial<AppContextInt>) => {
    setData(newData);
  };

  return (
    <AppContext.Provider value={{data, update}}>
      {props.children}
    </AppContext.Provider>
  );
};

const AuthProvider = (props: any) => {
  const [user, setUser] = useState<{uid: string} | undefined>(undefined);
  const [emu] = useState(true);

  function onAuthStateChanged(firUser: any): void {
    setUser(firUser);
  }
  useEffect(() => {
    if (__DEV__ && emu) {
      firFunc.useFunctionsEmulator('http://localhost:5001');
      firAuth.useEmulator('http://localhost:9099');
      db.settings({host: 'localhost:8080', ssl: false});
    }
    const subscriber = firAuth.onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
    //FIXME:  double call;
  }, []);

  return (
    <AuthContext.Provider value={user}>{props.children}</AuthContext.Provider>
  );
};

export {
  AppProvider,
  AppContext,
  AuthProvider,
  AuthContext,
  RequestContext,
  RequestProvider,
};
